import os
import json
import base64
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from cryptography.fernet import Fernet
from sqlalchemy.orm import Session

from .interface import HIMSAdapter, AuthenticationError, SessionExpiredError
from .adapters.doctor247 import Doctor247Adapter
from .mapper import DataMapper
from ..database import SessionLocal
from ..models import HIMSConnection

# Configure logger
logger = logging.getLogger("uvicorn")

# Security Check
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
if not ENCRYPTION_KEY:
    # Fail fast if security key is missing
    logger.error("ENCRYPTION_KEY NOT FOUND! Production requires a 32-byte Fernet key in .env.")
    # For local development convenience, we'll generate one but WARN loudly
    ENCRYPTION_KEY = Fernet.generate_key().decode()
    logger.warning(f"TEMPORARY ENCRYPTION_KEY GENERATED: {ENCRYPTION_KEY}. Use this in .env for persistence.")

try:
    cipher_suite = Fernet(ENCRYPTION_KEY.encode())
except Exception as e:
    raise RuntimeError(f"INVALID ENCRYPTION_KEY: {str(e)}")

class HIMSManager:
    """
    Coordinates interactions with multiple HIMS Adapters, including authentication and session management.
    """

    def __init__(self):
        self.mapper = DataMapper()
        # Mapping names to adapter classes
        self._adapter_map = {
            "doctor247": Doctor247Adapter,
            "doctor 24/7": Doctor247Adapter
        }

    def _encrypt(self, data: Dict[str, Any]) -> str:
        """Encrypts dictionary data to a string."""
        json_data = json.dumps(data).encode()
        return cipher_suite.encrypt(json_data).decode()

    def _decrypt(self, encrypted_str: str) -> Dict[str, Any]:
        """Decrypts string back to dictionary."""
        decrypted_data = cipher_suite.decrypt(encrypted_str.encode())
        return json.loads(decrypted_data.decode())

    def connect_hospital(self, hospital_id: str, hims_name: str, credentials: Dict[str, Any]) -> Dict[str, Any]:
        """
        Authenticates with HIMS, encrypts the session, and saves it to the database.
        """
        hims_key = hims_name.lower().replace(" ", "")
        adapter_class = self._adapter_map.get(hims_key)
        
        if not adapter_class:
            raise ValueError(f"HIMS Adapter for '{hims_name}' not supported.")

        # Create a temporary adapter to authenticate
        temp_adapter = adapter_class()
        
        try:
            # 1. Authenticate
            session_data = temp_adapter.authenticate(credentials)
            
            # 2. Encrypt
            encrypted_blob = self._encrypt({
                "credentials": credentials,
                "session": session_data,
                "hims_name": hims_name
            })
            
            # 3. Save to DB
            db = SessionLocal()
            try:
                conn = db.query(HIMSConnection).filter(HIMSConnection.hospital_id == hospital_id).first()
                if conn:
                    conn.hims_name = hims_name
                    conn.encrypted_data = encrypted_blob
                    conn.is_active = True
                else:
                    conn = HIMSConnection(
                        hospital_id=hospital_id,
                        hims_name=hims_name,
                        encrypted_data=encrypted_blob
                    )
                    db.add(conn)
                db.commit()
                return session_data
            finally:
                db.close()
                
        except AuthenticationError as e:
            logger.error(f"HIMS Manager: Connection failed for hospital {hospital_id}: {e}")
            raise

    def get_adapter_for_hospital(self, hospital_id: str) -> HIMSAdapter:
        """
        Loads, decrypts, validates session, and returns a configured adapter.
        Handles re-authentication if session is expired.
        """
        db = SessionLocal()
        try:
            conn = db.query(HIMSConnection).filter(
                HIMSConnection.hospital_id == hospital_id,
                HIMSConnection.is_active == True
            ).first()
            
            if not conn:
                raise ValueError(f"No active HIMS connection found for hospital {hospital_id}")
            
            # Decrypt
            data = self._decrypt(conn.encrypted_data)
            hims_name = data.get("hims_name")
            session = data.get("session")
            credentials = data.get("credentials")
            
            hims_key = hims_name.lower().replace(" ", "")
            adapter_class = self._adapter_map.get(hims_key)
            
            adapter = adapter_class(session=session)
            
            # Validate session
            if not adapter.validate_session(session):
                logger.info(f"HIMS Manager: Session expired for {hospital_id}. Re-authenticating...")
                try:
                    new_session = adapter.authenticate(credentials)
                    # Update DB with new session
                    data["session"] = new_session
                    conn.encrypted_data = self._encrypt(data)
                    db.commit()
                    adapter.session = new_session
                except AuthenticationError:
                    conn.is_active = False
                    db.commit()
                    raise SessionExpiredError(f"Session expired and re-authentication failed for hospital {hospital_id}")
            
            return adapter
            
        finally:
            db.close()

    def disconnect_hospital(self, hospital_id: str):
        """Disables HIMS connection for a hospital."""
        db = SessionLocal()
        try:
            conn = db.query(HIMSConnection).filter(HIMSConnection.hospital_id == hospital_id).first()
            if conn:
                conn.is_active = False
                db.commit()
                return True
            return False
        finally:
            db.close()

    def sync_all_recent_appointments(self, hours_back: int = 24) -> List[Dict[str, Any]]:
        """
        Polls all CONNECTED HIMS for appointments.
        """
        all_appointments = []
        db = SessionLocal()
        try:
            active_conns = db.query(HIMSConnection).filter(HIMSConnection.is_active == True).all()
            for conn in active_conns:
                try:
                    adapter = self.get_adapter_for_hospital(conn.hospital_id)
                    end_time = datetime.utcnow()
                    start_time = end_time - timedelta(hours=hours_back)
                    
                    raw_appointments = adapter.fetch_recent_appointments(start_time, end_time)
                    hims_type = adapter.get_hims_name().lower().replace(" ", "")
                    # Use the mapper to normalize
                    normalized = [self.mapper.map_appointment(apt, hims_type) for apt in raw_appointments]
                    all_appointments.extend(normalized)
                except Exception as e:
                    logger.error(f"Error syncing hospital {conn.hospital_id}: {e}")
            return all_appointments
        finally:
            db.close()

# Global manager instance
_hims_manager_instance = HIMSManager()

def get_hims_manager() -> HIMSManager:
    return _hims_manager_instance
