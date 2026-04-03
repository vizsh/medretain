"""
Patients router for MedRetain CRM.
Provides endpoints for patient management and ML-powered insights.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
import math

from ..database import get_db
from ..models import Patient
from ..schemas import (
    PatientListResponse,
    PatientBase,
    PatientDetail,
    PatientActionUpdate
)
from ..ml.churn_model import (
    predict_score,
    get_patient_risk_factors,
    get_patient_recommendations,
    analyze_patient_complete
)

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("", response_model=PatientListResponse)
def get_patients(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=200, description="Number of items per page"),
    churn_risk_label: Optional[str] = Query(None, description="Filter by churn risk label"),
    is_chronic: Optional[str] = Query(None, description="Filter by chronic condition status"),
    hospital_branch: Optional[str] = Query(None, description="Filter by hospital branch"),
    patient_segment: Optional[str] = Query(None, description="Filter by patient segment"),
    db: Session = Depends(get_db)
):
    """
    Get paginated list of patients with optional filters.

    Args:
        page: Page number (starting from 1)
        page_size: Number of patients per page (max 200)
        churn_risk_label: Filter by risk level (High/Medium/Low)
        is_chronic: Filter by chronic condition (Yes/No)
        hospital_branch: Filter by hospital branch
        patient_segment: Filter by patient segment

    Returns:
        Paginated list of patients with total count and page information
    """
    # Build query
    query = db.query(Patient)

    # Apply filters
    if churn_risk_label:
        query = query.filter(Patient.churn_risk_label == churn_risk_label)

    if is_chronic:
        query = query.filter(Patient.is_chronic == is_chronic)

    if hospital_branch:
        query = query.filter(Patient.hospital_branch == hospital_branch)

    if patient_segment:
        query = query.filter(Patient.patient_segment == patient_segment)

    # Get total count
    total = query.count()

    # Calculate pagination
    total_pages = math.ceil(total / page_size)
    offset = (page - 1) * page_size

    # Get paginated results
    patients = query.offset(offset).limit(page_size).all()

    # Convert to response format
    patient_list = [
        PatientBase(
            patient_id=p.patient_id,
            full_name=p.full_name,
            age=p.age,
            gender=p.gender,
            contact_number=p.contact_number,
            email=p.email,
            primary_condition=p.primary_condition,
            is_chronic=p.is_chronic,
            churn_risk_score=p.churn_risk_score,
            churn_risk_label=p.churn_risk_label,
            days_since_last_visit=p.days_since_last_visit,
            whatsapp_opt_in=p.whatsapp_opt_in,
            crm_action_required=p.crm_action_required,
            patient_segment=p.patient_segment,
            hospital_branch=p.hospital_branch,
            satisfaction_score=p.satisfaction_score,
            no_show_rate=p.no_show_rate
        )
        for p in patients
    ]

    return PatientListResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        patients=patient_list
    )


@router.get("/{patient_id}", response_model=PatientDetail)
def get_patient_detail(
    patient_id: str,
    db: Session = Depends(get_db)
):
    """
    Get detailed information for a specific patient.

    Args:
        patient_id: Patient ID

    Returns:
        Full patient details
    """
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()

    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    return PatientDetail.model_validate(patient)


@router.put("/{patient_id}/action")
def update_patient_action(
    patient_id: str,
    update: PatientActionUpdate,
    db: Session = Depends(get_db)
):
    """
    Update patient CRM action and mark as actioned.

    Args:
        patient_id: Patient ID
        update: Update data

    Returns:
        Success message
    """
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()

    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    # Update action required
    if update.crm_action_required is not None:
        patient.crm_action_required = update.crm_action_required

    db.commit()
    db.refresh(patient)

    return {
        "success": True,
        "message": f"Patient {patient_id} updated successfully",
        "patient_id": patient_id,
        "crm_action_required": patient.crm_action_required
    }


@router.get("/{patient_id}/risk-analysis")
def get_patient_risk_analysis(
    patient_id: str,
    db: Session = Depends(get_db)
):
    """
    Get ML-powered risk analysis for a specific patient.

    Returns:
        Risk factors, contributing features, and risk assessment
    """
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()

    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    # Convert patient to dictionary (only using fields that exist in the model)
    patient_dict = {
        'patient_id': patient.patient_id,
        'full_name': patient.full_name,
        'age': patient.age,
        'gender': patient.gender,
        'contact_number': patient.contact_number,
        'email': patient.email,
        'primary_condition': patient.primary_condition,
        'is_chronic': patient.is_chronic,
        'days_since_last_visit': patient.days_since_last_visit,
        'no_show_rate': patient.no_show_rate,
        'total_appointments': patient.total_appointments,
        'completed_visits': patient.completed_visits,
        'satisfaction_score': patient.satisfaction_score,
        'visit_frequency_per_year': patient.visit_frequency_per_year,
        'total_billed': patient.total_billed,
        'total_paid': patient.total_paid,
        'outstanding_balance': patient.outstanding_balance,
        'churn_risk_score': patient.churn_risk_score,
        'churn_risk_label': patient.churn_risk_label,
        'hospital_branch': patient.hospital_branch,
        'patient_segment': patient.patient_segment,
        'whatsapp_opt_in': patient.whatsapp_opt_in,
        'nps_score': patient.nps_score,
        'telehealth_visits': patient.telehealth_visits,
        'specialist_referrals': patient.specialist_referrals,
        'hospital_admissions': patient.hospital_admissions,
        'er_visits': patient.er_visits
    }

    try:
        risk_analysis = get_patient_risk_factors(patient_dict)
        return risk_analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing patient: {str(e)}")


@router.get("/{patient_id}/recommendations")
def get_patient_action_recommendations(
    patient_id: str,
    db: Session = Depends(get_db)
):
    """
    Get ML-powered actionable recommendations for a specific patient.

    Returns:
        Personalized recommendations, priority actions, and engagement strategy
    """
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()

    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    # Convert patient to dictionary (only using fields that exist in the model)
    patient_dict = {
        'patient_id': patient.patient_id,
        'full_name': patient.full_name,
        'age': patient.age,
        'gender': patient.gender,
        'contact_number': patient.contact_number,
        'email': patient.email,
        'primary_condition': patient.primary_condition,
        'is_chronic': patient.is_chronic,
        'days_since_last_visit': patient.days_since_last_visit,
        'no_show_rate': patient.no_show_rate,
        'total_appointments': patient.total_appointments,
        'completed_visits': patient.completed_visits,
        'satisfaction_score': patient.satisfaction_score,
        'visit_frequency_per_year': patient.visit_frequency_per_year,
        'total_billed': patient.total_billed,
        'total_paid': patient.total_paid,
        'outstanding_balance': patient.outstanding_balance,
        'churn_risk_score': patient.churn_risk_score,
        'churn_risk_label': patient.churn_risk_label,
        'hospital_branch': patient.hospital_branch,
        'patient_segment': patient.patient_segment,
        'whatsapp_opt_in': patient.whatsapp_opt_in,
        'nps_score': patient.nps_score,
        'telehealth_visits': patient.telehealth_visits,
        'specialist_referrals': patient.specialist_referrals,
        'hospital_admissions': patient.hospital_admissions,
        'er_visits': patient.er_visits
    }

    try:
        recommendations = get_patient_recommendations(patient_dict)
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")


@router.get("/{patient_id}/complete-analysis")
def get_patient_complete_analysis(
    patient_id: str,
    db: Session = Depends(get_db)
):
    """
    Get comprehensive ML-powered analysis for a specific patient.

    Combines risk assessment, feature analysis, and action plan.

    Returns:
        Complete analysis including risk factors, recommendations, and summary
    """
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()

    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    # Convert patient to dictionary (only using fields that exist in the model)
    patient_dict = {
        'patient_id': patient.patient_id,
        'full_name': patient.full_name,
        'age': patient.age,
        'gender': patient.gender,
        'contact_number': patient.contact_number,
        'email': patient.email,
        'primary_condition': patient.primary_condition,
        'is_chronic': patient.is_chronic,
        'days_since_last_visit': patient.days_since_last_visit,
        'no_show_rate': patient.no_show_rate,
        'total_appointments': patient.total_appointments,
        'completed_visits': patient.completed_visits,
        'satisfaction_score': patient.satisfaction_score,
        'visit_frequency_per_year': patient.visit_frequency_per_year,
        'total_billed': patient.total_billed,
        'total_paid': patient.total_paid,
        'outstanding_balance': patient.outstanding_balance,
        'churn_risk_score': patient.churn_risk_score,
        'churn_risk_label': patient.churn_risk_label,
        'hospital_branch': patient.hospital_branch,
        'patient_segment': patient.patient_segment,
        'whatsapp_opt_in': patient.whatsapp_opt_in,
        'nps_score': patient.nps_score,
        'telehealth_visits': patient.telehealth_visits,
        'specialist_referrals': patient.specialist_referrals,
        'hospital_admissions': patient.hospital_admissions,
        'er_visits': patient.er_visits
    }

    try:
        analysis = analyze_patient_complete(patient_dict)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing patient: {str(e)}")
