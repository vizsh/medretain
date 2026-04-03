"""
SQLAlchemy ORM models for MedRetain CRM.
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class Patient(Base):
    """
    Patient model representing all patient data from the CSV.
    """
    __tablename__ = "patients"

    # Primary identifier
    patient_id = Column(String(50), primary_key=True, index=True)

    # Demographics
    full_name = Column(String(200))
    age = Column(Integer)
    gender = Column(String(20))
    contact_number = Column(String(50))
    email = Column(String(200))

    # Medical information
    primary_condition = Column(String(200))
    is_chronic = Column(String(10))  # Yes/No
    primary_doctor_name = Column(String(200))

    # Churn risk metrics
    churn_risk_score = Column(Float, index=True)
    churn_risk_label = Column(String(20), index=True)  # Low/Medium/High
    days_since_last_visit = Column(Integer)

    # Visit and appointment data
    last_visit_date = Column(Date)
    total_appointments = Column(Integer)
    completed_visits = Column(Integer)
    no_show_rate = Column(Float)
    visit_frequency_per_year = Column(Float)

    # Financial data
    total_billed = Column(Float)
    total_paid = Column(Float)
    outstanding_balance = Column(Float)
    payment_history = Column(String(50))

    # Satisfaction and engagement
    satisfaction_score = Column(Float)
    nps_score = Column(Integer)
    feedback_received = Column(String(10))  # Yes/No

    # Hospital and operational data
    hospital_branch = Column(String(200), index=True)
    referral_source = Column(String(200))
    patient_segment = Column(String(50), index=True)
    loyalty_tier = Column(String(50))

    # WhatsApp and communication
    whatsapp_opt_in = Column(String(10), index=True)  # Yes/No
    preferred_contact_method = Column(String(50))
    last_whatsapp_message_date = Column(Date)
    last_whatsapp_message_status = Column(String(50))

    # CRM and action tracking
    crm_action_required = Column(String(200))
    followup_required = Column(String(10))  # Yes/No
    last_contacted_date = Column(Date)

    # Additional CSV columns
    insurance_provider = Column(String(200))
    insurance_status = Column(String(50))
    emergency_contact_name = Column(String(200))
    emergency_contact_number = Column(String(50))
    medical_record_number = Column(String(100))
    registration_date = Column(Date)
    last_prescription_date = Column(Date)
    prescription_adherence_score = Column(Float)
    lab_tests_completed = Column(Integer)
    imaging_scans_completed = Column(Integer)
    specialist_referrals = Column(Integer)
    hospital_admissions = Column(Integer)
    er_visits = Column(Integer)
    telehealth_visits = Column(Integer)
    avg_wait_time_minutes = Column(Float)
    service_rating = Column(Float)
    facility_rating = Column(Float)
    doctor_rating = Column(Float)
    communication_rating = Column(Float)
    appointment_booking_method = Column(String(50))
    preferred_appointment_time = Column(String(50))
    language_preference = Column(String(50))
    special_needs = Column(String(200))
    chronic_disease_program_enrolled = Column(String(10))  # Yes/No
    wellness_program_enrolled = Column(String(10))  # Yes/No

    # Relationships
    batch_associations = relationship("BatchPatient", back_populates="patient")
    messages = relationship("MessageLog", back_populates="patient")


class PatientBatch(Base):
    """
    Batch model for grouping patients for CRM actions.
    """
    __tablename__ = "patient_batches"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    batch_size = Column(Integer)
    filter_criteria = Column(Text)  # JSON string
    label = Column(String(200))

    # Relationships
    patient_associations = relationship("BatchPatient", back_populates="batch")


class BatchPatient(Base):
    """
    Association table linking patients to batches with action tracking.
    """
    __tablename__ = "batch_patients"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    batch_id = Column(Integer, ForeignKey("patient_batches.id"), index=True)
    patient_id = Column(String(50), ForeignKey("patients.patient_id"), index=True)
    actioned = Column(Boolean, default=False)
    actioned_at = Column(DateTime, nullable=True)

    # Relationships
    batch = relationship("PatientBatch", back_populates="patient_associations")
    patient = relationship("Patient", back_populates="batch_associations")


class MessageLog(Base):
    """
    Message log for tracking all WhatsApp communications.
    """
    __tablename__ = "message_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(String(50), ForeignKey("patients.patient_id"), index=True)
    message_type = Column(String(100))
    content = Column(Text)
    sent_at = Column(DateTime, default=datetime.utcnow, index=True)
    delivery_status = Column(String(50))
    twilio_sid = Column(String(100), unique=True)
    error_message = Column(Text, nullable=True)

    # Relationships
    patient = relationship("Patient", back_populates="messages")


class HIMSConnection(Base):
    """
    HIMS Connection model for storing and encrypting HIMS credentials and session data.
    """
    __tablename__ = "hims_connections"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    hospital_id = Column(String(50), unique=True, index=True, nullable=False)
    hims_name = Column(String(100), nullable=False)  # e.g., 'doctor247'
    
    # Encrypted session/credentials
    # We store the encrypted blob (credentials or active session)
    encrypted_data = Column(Text, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Optional flags
    is_active = Column(Boolean, default=True)
