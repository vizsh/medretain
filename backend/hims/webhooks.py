from fastapi import APIRouter, Request, HTTPException
from typing import Dict, Any
import logging

router = APIRouter()
logger = logging.getLogger("uvicorn")

@router.post("/hims/webhooks/doctor247")
async def doctor247_webhook_receiver(request: Request):
    """
    Real-time webhook listener for Doctor 24/7.
    Triggers when a patient cancels, misses, or completes an appointment.
    """
    try:
        raw_data = await request.json()
        logger.info(f"Received webhook from Doctor 24/7: {raw_data}")

        # The adaptive layer 'hears' it and immediately triggers retention scoring logic.
        patient_id = raw_data.get("p_id")
        event_type = raw_data.get("event") # e.g. "appointment_cancelled", "no_show"

        if patient_type := event_type in ["appointment_cancelled", "no_show"]:
            logger.info(f"Triggering high-risk retention score update for patient {patient_id}!")
            # CALL SCORING LOGIC HERE
            # e.g.: await update_patient_risk_score(patient_id)
            return {"status": "success", "message": f"Retention logic triggered for {patient_id}"}

        return {"status": "success", "message": "Webhook received, no action required."}

    except Exception as e:
        logger.error(f"Error processing Doctor 24/7 webhook: {e}")
        raise HTTPException(status_code=400, detail="Invalid webhook data format.")

@router.post("/hims/webhooks/instahealth")
async def instahealth_webhook_receiver(request: Request):
    """
    Real-time webhook listener for InstaHealth.
    """
    try:
        raw_data = await request.json()
        logger.info(f"Received webhook from InstaHealth: {raw_data}")

        # Map to standard format
        patient_id = raw_data.get("patient_uid")
        event = raw_data.get("action")

        if event in ["CANCELLATION", "RESCHEDULE"]:
            logger.info(f"Triggering retention alert for InstaHealth patient {patient_id}")
            # CALL SCORING LOGIC HERE
            return {"status": "success", "message": f"Alert generated for {patient_id}"}

        return {"status": "success", "message": "Ignored non-critical event."}

    except Exception as e:
        logger.error(f"Error processing InstaHealth webhook: {e}")
        raise HTTPException(status_code=400, detail="Invalid webhook payload.")
