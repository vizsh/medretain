"""
Pydantic schemas for request/response validation in MedRetain CRM.
"""
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime, date


class PatientBase(BaseModel):
    """Base patient schema with common fields."""
    patient_id: str
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    contact_number: Optional[str] = None
    email: Optional[str] = None
    primary_condition: Optional[str] = None
    is_chronic: Optional[str] = None
    churn_risk_score: Optional[float] = None
    churn_risk_label: Optional[str] = None
    days_since_last_visit: Optional[int] = None
    whatsapp_opt_in: Optional[str] = None
    crm_action_required: Optional[str] = None
    patient_segment: Optional[str] = None
    hospital_branch: Optional[str] = None
    satisfaction_score: Optional[float] = None
    no_show_rate: Optional[float] = None


class PatientDetail(PatientBase):
    """Detailed patient schema with all fields."""
    primary_doctor_name: Optional[str] = None
    last_visit_date: Optional[date] = None
    total_appointments: Optional[int] = None
    completed_visits: Optional[int] = None
    visit_frequency_per_year: Optional[float] = None
    total_billed: Optional[float] = None
    total_paid: Optional[float] = None
    outstanding_balance: Optional[float] = None
    payment_history: Optional[str] = None
    nps_score: Optional[int] = None
    feedback_received: Optional[str] = None
    referral_source: Optional[str] = None
    loyalty_tier: Optional[str] = None
    preferred_contact_method: Optional[str] = None
    last_whatsapp_message_date: Optional[date] = None
    last_whatsapp_message_status: Optional[str] = None
    followup_required: Optional[str] = None
    last_contacted_date: Optional[date] = None
    insurance_provider: Optional[str] = None
    insurance_status: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_number: Optional[str] = None
    medical_record_number: Optional[str] = None
    registration_date: Optional[date] = None
    last_prescription_date: Optional[date] = None
    prescription_adherence_score: Optional[float] = None
    lab_tests_completed: Optional[int] = None
    imaging_scans_completed: Optional[int] = None
    specialist_referrals: Optional[int] = None
    hospital_admissions: Optional[int] = None
    er_visits: Optional[int] = None
    telehealth_visits: Optional[int] = None
    avg_wait_time_minutes: Optional[float] = None
    service_rating: Optional[float] = None
    facility_rating: Optional[float] = None
    doctor_rating: Optional[float] = None
    communication_rating: Optional[float] = None
    appointment_booking_method: Optional[str] = None
    preferred_appointment_time: Optional[str] = None
    language_preference: Optional[str] = None
    special_needs: Optional[str] = None
    chronic_disease_program_enrolled: Optional[str] = None
    wellness_program_enrolled: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PatientListResponse(BaseModel):
    """Response schema for patient list endpoint."""
    total: int
    page: int
    page_size: int
    total_pages: int
    patients: List[PatientBase]


class PatientActionUpdate(BaseModel):
    """Schema for updating patient CRM action."""
    crm_action_required: Optional[str] = None


class BatchFilterCriteria(BaseModel):
    """Filter criteria for creating patient batches."""
    risk_level: Optional[str] = None  # High/Medium/Low
    segment: Optional[str] = None
    branch: Optional[str] = None
    is_chronic: Optional[str] = None  # Yes/No
    days_overdue: Optional[str] = None  # 30+, 60+, 90+, 180+
    satisfaction_level: Optional[str] = None  # low, medium, high
    no_show_risk: Optional[str] = None  # low, medium, high
    age_group: Optional[str] = None  # young, middle, senior
    whatsapp_only: Optional[bool] = None
    condition: Optional[str] = None
    limit: int = 50


class BatchCreate(BaseModel):
    """Schema for creating a new batch."""
    filter_criteria: BatchFilterCriteria
    label: str


class BatchResponse(BaseModel):
    """Response schema for batch information."""
    id: int
    created_at: datetime
    batch_size: int
    filter_criteria: str
    label: str
    patient_count: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class BatchPatientResponse(BaseModel):
    """Response schema for batch patient information."""
    patient_id: str
    full_name: Optional[str] = None
    churn_risk_label: Optional[str] = None
    churn_risk_score: Optional[float] = None
    contact_number: Optional[str] = None
    actioned: bool

    model_config = ConfigDict(from_attributes=True)


class MessageSendRequest(BaseModel):
    """Schema for sending a message."""
    patient_id: str
    message_type: str
    custom_text: Optional[str] = None


class MessageResponse(BaseModel):
    """Response schema for message information."""
    id: int
    patient_id: str
    message_type: str
    content: str
    sent_at: datetime
    delivery_status: str
    twilio_sid: Optional[str] = None
    error_message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AnalyticsSummary(BaseModel):
    """Schema for analytics summary."""
    total_patients: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    avg_churn_score: float
    total_at_risk: int
    whatsapp_opt_in_percentage: float
    avg_satisfaction_score: float
    count_by_segment: dict


class RetentionTrendPoint(BaseModel):
    """Schema for a single retention trend data point."""
    month: str
    patient_count: int


class RetentionTrendResponse(BaseModel):
    """Response schema for retention trend."""
    trend: List[RetentionTrendPoint]
