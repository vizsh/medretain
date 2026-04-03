"""
Batches router for MedRetain CRM.
Provides endpoints for creating and managing patient batches.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import json

from ..database import get_db
from ..models import Patient, PatientBatch, BatchPatient
from ..schemas import (
    BatchCreate,
    BatchResponse,
    BatchPatientResponse
)

router = APIRouter(prefix="/batches", tags=["batches"])


@router.get("/filter-options")
def get_filter_options(db: Session = Depends(get_db)):
    """
    Get available filter options based on actual data in the database.
    Returns unique values for each filterable field.
    """
    # Get unique branches
    branches = [b[0] for b in db.query(Patient.hospital_branch).distinct().filter(Patient.hospital_branch.isnot(None)).all()]

    # Get unique segments
    segments = [s[0] for s in db.query(Patient.patient_segment).distinct().filter(Patient.patient_segment.isnot(None)).all()]

    # Get unique conditions (top 15)
    conditions = [c[0] for c in db.query(Patient.primary_condition, func.count()).group_by(Patient.primary_condition).order_by(func.count().desc()).limit(15).all() if c[0]]

    return {
        "risk_levels": ["High", "Medium", "Low"],
        "branches": sorted(branches),
        "segments": sorted(segments),
        "conditions": conditions,
        "chronic_options": ["Yes", "No"],
        "days_overdue_options": [
            {"value": "30+", "label": "30+ days overdue"},
            {"value": "60+", "label": "60+ days overdue"},
            {"value": "90+", "label": "90+ days overdue"},
            {"value": "180+", "label": "180+ days overdue"},
            {"value": "365+", "label": "1 year+ overdue"}
        ],
        "satisfaction_levels": [
            {"value": "low", "label": "Low (1-2)"},
            {"value": "medium", "label": "Medium (2-3.5)"},
            {"value": "high", "label": "High (3.5-5)"}
        ],
        "no_show_risk_levels": [
            {"value": "low", "label": "Low (<10%)"},
            {"value": "medium", "label": "Medium (10-25%)"},
            {"value": "high", "label": "High (>25%)"}
        ],
        "age_groups": [
            {"value": "young", "label": "Young (18-35)"},
            {"value": "middle", "label": "Middle (35-55)"},
            {"value": "senior", "label": "Senior (55+)"}
        ]
    }


@router.post("", response_model=BatchResponse, status_code=201)
def create_batch(
    batch_request: BatchCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new patient batch with unseen patients.

    This endpoint queries for patients matching the filter criteria who have NOT
    been included in any previous batch. This allows hospital staff to keep
    requesting fresh cohorts of at-risk patients they haven't contacted yet.

    Args:
        batch_request: Batch creation request with filters and label

    Returns:
        Created batch with patient information
    """
    filters = batch_request.filter_criteria
    limit = filters.limit

    # Build base query
    query = db.query(Patient)

    # Apply filters
    if filters.risk_level:
        query = query.filter(Patient.churn_risk_label == filters.risk_level)

    if filters.segment:
        query = query.filter(Patient.patient_segment == filters.segment)

    if filters.branch:
        query = query.filter(Patient.hospital_branch == filters.branch)

    if filters.is_chronic:
        query = query.filter(Patient.is_chronic == filters.is_chronic)

    if filters.condition:
        query = query.filter(Patient.primary_condition == filters.condition)

    # Days overdue filter
    if filters.days_overdue:
        days_map = {"30+": 30, "60+": 60, "90+": 90, "180+": 180, "365+": 365}
        if filters.days_overdue in days_map:
            query = query.filter(Patient.days_since_last_visit >= days_map[filters.days_overdue])

    # Satisfaction level filter
    if filters.satisfaction_level:
        if filters.satisfaction_level == "low":
            query = query.filter(Patient.satisfaction_score < 2)
        elif filters.satisfaction_level == "medium":
            query = query.filter(Patient.satisfaction_score >= 2, Patient.satisfaction_score < 3.5)
        elif filters.satisfaction_level == "high":
            query = query.filter(Patient.satisfaction_score >= 3.5)

    # No-show risk filter
    if filters.no_show_risk:
        if filters.no_show_risk == "low":
            query = query.filter(Patient.no_show_rate < 0.1)
        elif filters.no_show_risk == "medium":
            query = query.filter(Patient.no_show_rate >= 0.1, Patient.no_show_rate < 0.25)
        elif filters.no_show_risk == "high":
            query = query.filter(Patient.no_show_rate >= 0.25)

    # Age group filter
    if filters.age_group:
        if filters.age_group == "young":
            query = query.filter(Patient.age >= 18, Patient.age < 35)
        elif filters.age_group == "middle":
            query = query.filter(Patient.age >= 35, Patient.age < 55)
        elif filters.age_group == "senior":
            query = query.filter(Patient.age >= 55)

    # WhatsApp only filter
    if filters.whatsapp_only:
        query = query.filter(Patient.whatsapp_opt_in == "Yes")

    # Exclude patients already in any batch
    existing_batch_patient_ids = db.query(BatchPatient.patient_id).distinct()
    query = query.filter(~Patient.patient_id.in_(existing_batch_patient_ids))

    # Order by churn risk score descending (highest risk first)
    query = query.order_by(Patient.churn_risk_score.desc())

    # Get unseen patients
    unseen_patients = query.limit(limit).all()

    if not unseen_patients:
        raise HTTPException(
            status_code=404,
            detail="No unseen patients found matching the criteria"
        )

    # Create batch
    filter_criteria_json = json.dumps({
        "risk_level": filters.risk_level,
        "segment": filters.segment,
        "branch": filters.branch,
        "is_chronic": filters.is_chronic,
        "days_overdue": filters.days_overdue,
        "satisfaction_level": filters.satisfaction_level,
        "no_show_risk": filters.no_show_risk,
        "age_group": filters.age_group,
        "whatsapp_only": filters.whatsapp_only,
        "condition": filters.condition,
        "limit": filters.limit
    })

    new_batch = PatientBatch(
        batch_size=len(unseen_patients),
        filter_criteria=filter_criteria_json,
        label=batch_request.label
    )

    db.add(new_batch)
    db.flush()  # Get the batch ID

    # Add patients to batch
    for patient in unseen_patients:
        batch_patient = BatchPatient(
            batch_id=new_batch.id,
            patient_id=patient.patient_id,
            actioned=False
        )
        db.add(batch_patient)

    db.commit()
    db.refresh(new_batch)

    return BatchResponse(
        id=new_batch.id,
        created_at=new_batch.created_at,
        batch_size=new_batch.batch_size,
        filter_criteria=new_batch.filter_criteria,
        label=new_batch.label,
        patient_count=len(unseen_patients)
    )


@router.get("", response_model=list[BatchResponse])
def get_batches(
    db: Session = Depends(get_db)
):
    """
    Get all patient batches with patient counts.

    Returns:
        List of all batches
    """
    batches = db.query(PatientBatch).order_by(PatientBatch.created_at.desc()).all()

    batch_responses = []
    for batch in batches:
        patient_count = db.query(BatchPatient).filter(
            BatchPatient.batch_id == batch.id
        ).count()

        batch_responses.append(
            BatchResponse(
                id=batch.id,
                created_at=batch.created_at,
                batch_size=batch.batch_size,
                filter_criteria=batch.filter_criteria,
                label=batch.label,
                patient_count=patient_count
            )
        )

    return batch_responses


@router.get("/{batch_id}/patients", response_model=list[BatchPatientResponse])
def get_batch_patients(
    batch_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all patients in a specific batch.

    Args:
        batch_id: Batch ID

    Returns:
        List of patients in the batch
    """
    # Check if batch exists
    batch = db.query(PatientBatch).filter(PatientBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")

    # Get batch patients with patient details
    batch_patients = (
        db.query(BatchPatient, Patient)
        .join(Patient, BatchPatient.patient_id == Patient.patient_id)
        .filter(BatchPatient.batch_id == batch_id)
        .all()
    )

    responses = []
    for batch_patient, patient in batch_patients:
        responses.append(
            BatchPatientResponse(
                patient_id=patient.patient_id,
                full_name=patient.full_name,
                churn_risk_label=patient.churn_risk_label,
                churn_risk_score=patient.churn_risk_score,
                contact_number=patient.contact_number,
                actioned=batch_patient.actioned
            )
        )

    return responses


@router.post("/{batch_id}/patients/{patient_id}/action")
def mark_batch_patient_actioned(
    batch_id: int,
    patient_id: str,
    db: Session = Depends(get_db)
):
    """
    Mark a patient in a batch as actioned.

    Args:
        batch_id: Batch ID
        patient_id: Patient ID

    Returns:
        Success message
    """
    # Find the batch patient record
    batch_patient = (
        db.query(BatchPatient)
        .filter(
            BatchPatient.batch_id == batch_id,
            BatchPatient.patient_id == patient_id
        )
        .first()
    )

    if not batch_patient:
        raise HTTPException(
            status_code=404,
            detail=f"Patient {patient_id} not found in batch {batch_id}"
        )

    # Mark as actioned
    batch_patient.actioned = True
    batch_patient.actioned_at = datetime.utcnow()

    db.commit()

    return {
        "success": True,
        "message": f"Patient {patient_id} in batch {batch_id} marked as actioned",
        "batch_id": batch_id,
        "patient_id": patient_id,
        "actioned": True,
        "actioned_at": batch_patient.actioned_at
    }
