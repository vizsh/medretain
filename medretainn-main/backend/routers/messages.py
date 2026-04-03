"""
Messages router for MedRetain CRM.
Provides endpoints for sending WhatsApp messages via Twilio.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import os
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

from ..database import get_db
from ..models import Patient, MessageLog
from ..schemas import MessageSendRequest, MessageResponse

router = APIRouter(prefix="/messages", tags=["messages"])

# Twilio configuration from environment
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")


class BatchMessageRequest(BaseModel):
    patient_ids: List[str]
    message_type: str
    custom_text: Optional[str] = None


def get_twilio_client():
    """Get Twilio client instance."""
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        return None
    return Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)


def format_whatsapp_number(phone_number: str) -> str:
    """
    Format phone number for WhatsApp.
    Adds 'whatsapp:' prefix if not present.
    """
    if not phone_number:
        return ""
    phone = phone_number.strip()
    if phone.startswith("whatsapp:"):
        phone = phone.replace("whatsapp:", "")
    phone = phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    if not phone.startswith("+"):
        if len(phone) == 10:
            phone = "+91" + phone
        else:
            phone = "+" + phone
    return f"whatsapp:{phone}"


def generate_message_content(patient: Patient, message_type: str, custom_text: str = None) -> str:
    """
    Generate message content based on message type with patient-specific details.
    """
    if custom_text:
        return custom_text

    first_name = patient.full_name.split()[0] if patient.full_name else "Valued Patient"

    templates = {
        "reminder": (
            f"Hi {first_name}, this is a reminder from {patient.hospital_branch or 'our hospital'}. "
            f"Dr. {patient.primary_doctor_name or 'your doctor'} recommends scheduling your next visit. "
            f"Reply YES to confirm interest or STOP to unsubscribe."
        ),
        "reengagement": (
            f"Hi {first_name}, we noticed it's been {patient.days_since_last_visit or 'several'} days since your last visit. "
            f"Managing {patient.primary_condition or 'your condition'} requires regular follow-ups. "
            f"Can we schedule a check-in this week? Reply YES or STOP."
        ),
        "followup": (
            f"Hi {first_name}, hope you're feeling well after your recent visit. "
            f"Dr. {patient.primary_doctor_name or 'your doctor'} wanted to check in. "
            f"Any concerns? Reply anytime or STOP to unsubscribe."
        ),
    }

    return templates.get(message_type, f"Hello {first_name}, this is a message from our hospital team.")


@router.post("/send", status_code=201)
def send_message(
    request: MessageSendRequest,
    db: Session = Depends(get_db)
):
    """
    Send a real WhatsApp message to a patient via Twilio.
    """
    patient = db.query(Patient).filter(Patient.patient_id == request.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {request.patient_id} not found")

    if not patient.contact_number:
        raise HTTPException(status_code=400, detail=f"Patient {request.patient_id} has no contact number")

    message_content = generate_message_content(patient, request.message_type, request.custom_text)
    
    message_log = MessageLog(
        patient_id=request.patient_id,
        message_type=request.message_type,
        content=message_content,
        sent_at=datetime.utcnow()
    )

    twilio_client = get_twilio_client()
    if not twilio_client:
        raise HTTPException(status_code=500, detail="Twilio NOT configured")

    try:
        to_number = format_whatsapp_number(patient.contact_number)
        message = twilio_client.messages.create(
            from_=TWILIO_WHATSAPP_FROM,
            to=to_number,
            body=message_content
        )
        message_log.delivery_status = message.status
        message_log.twilio_sid = message.sid
        patient.last_whatsapp_message_date = datetime.utcnow().date()
        patient.last_whatsapp_message_status = message.status
        db.add(message_log)
        db.commit()
        db.refresh(message_log)
        return {"success": True, "sid": message.sid, "status": message.status}
    except Exception as e:
        message_log.delivery_status = "failed"
        message_log.error_message = str(e)
        db.add(message_log)
        db.commit()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/send-batch", status_code=201)
def send_batch_messages(
    request: BatchMessageRequest,
    db: Session = Depends(get_db)
):
    """
    Trigger batch messaging for multiple patients.
    """
    results = []
    twilio_client = get_twilio_client()
    if not twilio_client:
        raise HTTPException(status_code=500, detail="Twilio NOT configured")

    for pid in request.patient_ids:
        patient = db.query(Patient).filter(Patient.patient_id == pid).first()
        if not patient or not patient.contact_number:
            results.append({"patient_id": pid, "success": False, "error": "No contact number"})
            continue
            
        content = generate_message_content(patient, request.message_type, request.custom_text)
        try:
            to_number = format_whatsapp_number(patient.contact_number)
            message = twilio_client.messages.create(from_=TWILIO_WHATSAPP_FROM, to=to_number, body=content)
            
            log = MessageLog(patient_id=pid, message_type=request.message_type, content=content, 
                             sent_at=datetime.utcnow(), delivery_status=message.status, twilio_sid=message.sid)
            patient.last_whatsapp_message_date = datetime.utcnow().date()
            patient.last_whatsapp_message_status = message.status
            db.add(log)
            results.append({"patient_id": pid, "success": True, "sid": message.sid})
        except Exception as e:
            results.append({"patient_id": pid, "success": False, "error": str(e)})
    
    db.commit()
    return {"results": results}


@router.get("/log", response_model=list[dict])
def get_message_log(db: Session = Depends(get_db)):
    messages = (db.query(MessageLog, Patient.full_name)
                .join(Patient, MessageLog.patient_id == Patient.patient_id)
                .order_by(MessageLog.sent_at.desc()).limit(100).all())
    return [{"id": m.id, "patient_id": m.patient_id, "patient_name": name, "message_type": m.message_type, 
             "content": m.content, "sent_at": m.sent_at, "delivery_status": m.delivery_status} for m, name in messages]


@router.get("/{patient_id}", response_model=list[MessageResponse])
def get_patient_messages(patient_id: str, db: Session = Depends(get_db)):
    messages = db.query(MessageLog).filter(MessageLog.patient_id == patient_id).order_by(MessageLog.sent_at.desc()).all()
    return [MessageResponse.model_validate(m) for m in messages]
