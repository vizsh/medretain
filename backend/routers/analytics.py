"""
Analytics router for MedRetain CRM.
Provides endpoints for analytics, reporting, and ML model information.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Optional

from ..database import get_db
from ..models import Patient
from ..schemas import AnalyticsSummary, RetentionTrendResponse, RetentionTrendPoint
from ..ml.churn_model import (
    get_feature_importance,
    get_feature_importance_detailed,
    get_model_info
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary", response_model=AnalyticsSummary)
def get_analytics_summary(
    db: Session = Depends(get_db)
):
    """
    Get summary analytics for the patient database.

    Returns:
        Analytics summary with key metrics including:
        - Total patients
        - Count by churn risk label (High/Medium/Low)
        - Average churn score
        - Total at-risk patients (High + Medium)
        - WhatsApp opt-in percentage
        - Average satisfaction score
        - Count by patient segment
    """
    # Total patients
    total_patients = db.query(Patient).count()

    # Count by churn risk label
    high_risk_count = db.query(Patient).filter(Patient.churn_risk_label == "High").count()
    medium_risk_count = db.query(Patient).filter(Patient.churn_risk_label == "Medium").count()
    low_risk_count = db.query(Patient).filter(Patient.churn_risk_label == "Low").count()

    # Average churn score
    avg_churn_score = db.query(func.avg(Patient.churn_risk_score)).scalar() or 0.0

    # Total at-risk (High + Medium)
    total_at_risk = high_risk_count + medium_risk_count

    # WhatsApp opt-in percentage
    whatsapp_opted_in = db.query(Patient).filter(Patient.whatsapp_opt_in == "Yes").count()
    whatsapp_opt_in_percentage = (whatsapp_opted_in / total_patients * 100) if total_patients > 0 else 0.0

    # Average satisfaction score
    avg_satisfaction_score = db.query(func.avg(Patient.satisfaction_score)).scalar() or 0.0

    # Count by patient segment
    segment_counts = db.query(
        Patient.patient_segment,
        func.count(Patient.patient_id)
    ).group_by(Patient.patient_segment).all()

    count_by_segment = {
        str(segment): count for segment, count in segment_counts if segment
    }

    return AnalyticsSummary(
        total_patients=total_patients,
        high_risk_count=high_risk_count,
        medium_risk_count=medium_risk_count,
        low_risk_count=low_risk_count,
        avg_churn_score=float(avg_churn_score),
        total_at_risk=total_at_risk,
        whatsapp_opt_in_percentage=float(whatsapp_opt_in_percentage),
        avg_satisfaction_score=float(avg_satisfaction_score),
        count_by_segment=count_by_segment
    )


@router.get("/retention-trend", response_model=RetentionTrendResponse)
def get_retention_trend(
    db: Session = Depends(get_db)
):
    """
    Get retention trend data showing patient visit patterns over the past 12 months.

    Returns month-by-month counts of patients who had their last visit in each month.

    Returns:
        Retention trend with monthly patient counts
    """
    # Calculate date for 12 months ago
    twelve_months_ago = datetime.now() - timedelta(days=365)

    # Query patients with last_visit_date in the past 12 months
    patients_with_visits = db.query(
        Patient.last_visit_date
    ).filter(
        Patient.last_visit_date.isnot(None),
        Patient.last_visit_date >= twelve_months_ago.date()
    ).all()

    # Count patients by month
    month_counts = defaultdict(int)

    for (visit_date,) in patients_with_visits:
        if visit_date:
            # Format as "YYYY-MM"
            month_key = visit_date.strftime("%Y-%m")
            month_counts[month_key] += 1

    # Generate list of past 12 months
    trend_data = []
    current_date = datetime.now()

    for i in range(11, -1, -1):
        month_date = current_date - timedelta(days=30 * i)
        month_key = month_date.strftime("%Y-%m")
        month_label = month_date.strftime("%b %Y")  # e.g., "Jan 2024"

        trend_data.append(
            RetentionTrendPoint(
                month=month_label,
                patient_count=month_counts.get(month_key, 0)
            )
        )

    return RetentionTrendResponse(trend=trend_data)


@router.get("/churn-distribution")
def get_churn_distribution(
    db: Session = Depends(get_db)
):
    """
    Get distribution of patients across churn risk score ranges.

    Returns:
        Dictionary with churn score ranges and patient counts
    """
    # Define score ranges
    ranges = [
        (0, 20, "0-20 (Very Low)"),
        (20, 40, "20-40 (Low)"),
        (40, 60, "40-60 (Medium)"),
        (60, 80, "60-80 (High)"),
        (80, 100, "80-100 (Very High)")
    ]

    distribution = {}

    for min_score, max_score, label in ranges:
        count = db.query(Patient).filter(
            Patient.churn_risk_score >= min_score,
            Patient.churn_risk_score < max_score
        ).count()
        distribution[label] = count

    return {
        "distribution": distribution,
        "total_patients": sum(distribution.values())
    }


@router.get("/branch-performance")
def get_branch_performance(
    db: Session = Depends(get_db)
):
    """
    Get performance metrics by hospital branch.

    Returns:
        List of branches with patient counts, average satisfaction, and churn metrics
    """
    # Query branch statistics
    branch_stats = db.query(
        Patient.hospital_branch,
        func.count(Patient.patient_id).label("patient_count"),
        func.avg(Patient.satisfaction_score).label("avg_satisfaction"),
        func.avg(Patient.churn_risk_score).label("avg_churn_score"),
        func.sum(func.case((Patient.churn_risk_label == "High", 1), else_=0)).label("high_risk_count")
    ).group_by(Patient.hospital_branch).all()

    branches = []

    for branch, patient_count, avg_satisfaction, avg_churn_score, high_risk_count in branch_stats:
        if branch:  # Skip null branches
            branches.append({
                "branch": branch,
                "patient_count": patient_count,
                "avg_satisfaction_score": float(avg_satisfaction or 0),
                "avg_churn_score": float(avg_churn_score or 0),
                "high_risk_count": int(high_risk_count or 0),
                "high_risk_percentage": (high_risk_count / patient_count * 100) if patient_count > 0 else 0
            })

    # Sort by patient count descending
    branches.sort(key=lambda x: x["patient_count"], reverse=True)

    return {
        "branches": branches,
        "total_branches": len(branches)
    }


@router.get("/engagement-metrics")
def get_engagement_metrics(
    db: Session = Depends(get_db)
):
    """
    Get patient engagement metrics.

    Returns:
        Engagement statistics including visit frequency, appointment adherence, etc.
    """
    total_patients = db.query(Patient).count()

    # Average visit frequency
    avg_visit_frequency = db.query(func.avg(Patient.visit_frequency_per_year)).scalar() or 0.0

    # Average no-show rate
    avg_no_show_rate = db.query(func.avg(Patient.no_show_rate)).scalar() or 0.0

    # Patients with chronic conditions
    chronic_patients = db.query(Patient).filter(Patient.is_chronic == "Yes").count()
    chronic_percentage = (chronic_patients / total_patients * 100) if total_patients > 0 else 0.0

    # Feedback received
    feedback_received = db.query(Patient).filter(Patient.feedback_received == "Yes").count()
    feedback_percentage = (feedback_received / total_patients * 100) if total_patients > 0 else 0.0

    # Average NPS score
    avg_nps_score = db.query(func.avg(Patient.nps_score)).scalar() or 0.0

    # Telehealth adoption
    telehealth_users = db.query(Patient).filter(Patient.telehealth_visits > 0).count()
    telehealth_percentage = (telehealth_users / total_patients * 100) if total_patients > 0 else 0.0

    return {
        "total_patients": total_patients,
        "avg_visit_frequency_per_year": float(avg_visit_frequency),
        "avg_no_show_rate": float(avg_no_show_rate),
        "chronic_patients_count": chronic_patients,
        "chronic_patients_percentage": float(chronic_percentage),
        "feedback_received_count": feedback_received,
        "feedback_received_percentage": float(feedback_percentage),
        "avg_nps_score": float(avg_nps_score),
        "telehealth_users_count": telehealth_users,
        "telehealth_adoption_percentage": float(telehealth_percentage)
    }


@router.get("/conditions-breakdown")
def get_conditions_breakdown(
    db: Session = Depends(get_db)
):
    """
    Get top 5 conditions by patient count with average churn risk.

    Returns:
        Top 5 conditions with patient counts and average churn scores
    """
    # Query conditions with patient counts and average churn scores
    conditions_data = db.query(
        Patient.primary_condition,
        func.count(Patient.patient_id).label("patient_count"),
        func.avg(Patient.churn_risk_score).label("avg_churn_score")
    ).filter(
        Patient.primary_condition.isnot(None),
        Patient.primary_condition != ""
    ).group_by(
        Patient.primary_condition
    ).order_by(
        func.count(Patient.patient_id).desc()
    ).limit(5).all()

    conditions = []
    for condition, patient_count, avg_churn_score in conditions_data:
        # Determine color based on average churn score
        score = float(avg_churn_score or 0)
        if score >= 70:
            color = "#ff6b6b"  # Red for high risk
        elif score >= 40:
            color = "#ffd166"  # Amber for medium risk
        else:
            color = "#00d4a8"  # Green for low risk

        conditions.append({
            "condition": condition,
            "patient_count": int(patient_count),
            "avg_churn_score": round(score, 1),
            "color": color
        })

    return {
        "conditions": conditions,
        "total_conditions": len(conditions)
    }


# ML Model Endpoints

@router.get("/ml/model-info")
def get_ml_model_info():
    """
    Get information about the trained ML model.

    Returns:
        Model status, accuracy metrics, feature information, and training details
    """
    try:
        info = get_model_info()
        return info
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


@router.get("/ml/feature-importance")
def get_ml_feature_importance(
    top_n: Optional[int] = Query(None, description="Number of top features to return")
):
    """
    Get feature importance rankings from the trained ML model.

    Args:
        top_n: Optional number of top features to return (default: all)

    Returns:
        Dictionary of feature names and their importance scores, sorted by importance
    """
    try:
        importances = get_feature_importance(top_n=top_n)
        return {
            "feature_importances": importances,
            "total_features": len(importances)
        }
    except FileNotFoundError:
        return {
            "error": "Model not trained",
            "message": "Please train the model first using: python -m backend.ml.train"
        }
    except Exception as e:
        return {
            "error": str(e)
        }


@router.get("/ml/feature-importance-detailed")
def get_ml_feature_importance_detailed():
    """
    Get detailed feature importance with descriptions and impact analysis.

    Returns:
        List of features with importance, percentage, description, and impact level
    """
    try:
        detailed = get_feature_importance_detailed()
        return {
            "features": detailed,
            "total_features": len(detailed)
        }
    except FileNotFoundError:
        return {
            "error": "Model not trained",
            "message": "Please train the model first using: python -m backend.ml.train"
        }
    except Exception as e:
        return {
            "error": str(e)
        }