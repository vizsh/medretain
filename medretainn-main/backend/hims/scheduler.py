import asyncio
import logging
import os
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from .manager import get_hims_manager, HIMSManager
from .adapters.doctor247 import Doctor247Adapter
from .interface import SessionExpiredError
from ..database import SessionLocal
from ..models import Patient, HIMSConnection, MessageLog
from ..ml.churn_model import predict_score
from ..routers.messages import send_message, MessageSendRequest

# Configure logging
logger = logging.getLogger("uvicorn")

class HIMSPollingScheduler:
    """
    The 'Heartbeat' Scheduler that polls real HIMS data and executes retention tasks.
    """

    def __init__(self, interval_seconds: int = 3600):
        self.interval_seconds = interval_seconds
        self.is_running = False

    async def start(self):
        """
        Starts the production polling loop.
        """
        if self.is_running:
            return

        self.is_running = True
        logger.info(f"PRODUCTION HIMS Scheduler STARTED! Polling every {self.interval_seconds}s.")

        while self.is_running:
            try:
                await self.process_all_hospitals()
            except Exception as e:
                logger.error(f"Critical error in HIMS polling loop: {e}")

            logger.info(f"Scheduler: Cycle complete. Sleeping for {self.interval_seconds}s...")
            await asyncio.sleep(self.interval_seconds)

    async def process_all_hospitals(self):
        """
        Iterates through all registered HIMS connections and syncs data.
        """
        db = SessionLocal()
        try:
            manager = get_hims_manager()
            active_connections = db.query(HIMSConnection).filter(HIMSConnection.is_active == True).all()
            
            if not active_connections:
                logger.info("Scheduler: No active HIMS connections found.")
                return

            for conn in active_connections:
                try:
                    logger.info(f"Scheduler: Processing hospital {conn.hospital_id} ({conn.hims_name})...")
                    await self.sync_and_action_hospital(db, manager, conn)
                except SessionExpiredError:
                    logger.warning(f"Scheduler: HIMS Session expired for {conn.hospital_id}. Marking as inactive.")
                    conn.is_active = False
                    db.commit()
                except Exception as e:
                    logger.error(f"Scheduler: Error processing hospital {conn.hospital_id}: {e}")
        finally:
            db.close()

    async def sync_and_action_hospital(self, db: Session, manager: HIMSManager, conn: HIMSConnection):
        """
        Syncs appointments, updates patients, scores them, and triggers actions.
        """
        adapter = manager.get_adapter_for_hospital(conn.hospital_id)
        
        # 1. Fetch recent appointments (last 24 hours)
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=24)
        
        raw_appointments = adapter.fetch_recent_appointments(start_time, end_time)
        hims_type = conn.hims_name.lower().replace(" ", "")
        
        # 2. Identify potential dropouts
        for raw_apt in raw_appointments:
            apt = manager.mapper.map_appointment(raw_apt, hims_type)
            status = apt.get("status", "").lower()
            
            if status in ["cancelled", "no-show", "missed"]:
                patient_id = apt.get("patient_id")
                if not patient_id: continue
                
                logger.info(f"Scheduler: Detected dropout for patient {patient_id} ({status})")
                
                # 3. Pull real patient profile from HIMS
                raw_profile = adapter.sync_patient_profile(patient_id)
                standard_profile = manager.mapper.map_doctor247_patient(raw_profile) # Should use generic map if exists
                
                # 4. Upsert patient in local CRM DB
                patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
                if not patient:
                    patient = Patient(patient_id=patient_id)
                    db.add(patient)
                
                # Update demographic and visit fields
                patient.full_name = standard_profile.get("full_name")
                patient.contact_number = standard_profile.get("contact_number")
                patient.gender = standard_profile.get("gender")
                patient.age = standard_profile.get("age")
                patient.primary_condition = standard_profile.get("medical_history", ["Unknown"])[0] if standard_profile.get("medical_history") else "Unknown"
                patient.is_chronic = "Yes" if standard_profile.get("is_chronic") else "No"
                # Update days since last visit for scoring
                patient.days_since_last_visit = (datetime.utcnow().date() - datetime.fromisoformat(standard_profile.get("last_visit_date", datetime.utcnow().date().isoformat())).date()).days
                
                # 5. Execute ML Scoring
                # Convert patient to dict for model
                patient_dict = {
                    "days_since_last_visit": patient.days_since_last_visit or 30,
                    "no_show_rate": 0.5, # High risk due to current no-show/cancellation
                    "satisfaction_score": 3.0,
                    "is_chronic": patient.is_chronic
                }
                score, label = predict_score(patient_dict)
                patient.churn_risk_score = score
                patient.churn_risk_label = label
                
                db.commit()
                
                # 6. Automated Retention Task (WhatsApp)
                if label == "High" and patient.whatsapp_opt_in == "Yes":
                    logger.info(f"Scheduler: TRIGGERING AUTOMATIC WHATSAPP for HIGH RISK patient {patient_id}")
                    try:
                        # Use our messaging service logic
                        req = MessageSendRequest(
                            patient_id=patient_id,
                            message_type="reengagement" if status == "no-show" else "reminder"
                        )
                        # We call send_message function directly (it handles logging internally)
                        send_message(req, db)
                        logger.info(f"Scheduler: Successfully sent automated message to {patient_id}")
                    except Exception as e:
                        logger.error(f"Scheduler: Failed to send automated message to {patient_id}: {e}")

    def stop(self):
        self.is_running = False
        logger.info("HIMS Polling Scheduler STOPPED!")

# Global scheduler instance
hims_scheduler = HIMSPollingScheduler(interval_seconds=3600)
