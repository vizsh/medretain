"""
Data loader for MedRetain CRM.
Responsible for initializing models and predictions.
MOCK CSV Loading is DISABLED for production.
"""
import os
import pandas as pd
from sqlalchemy.orm import Session
from .database import SessionLocal, engine
from .models import Patient, Base
from .ml.churn_model import predict_batch

def initialize_data():
    """
    In production, this ensures only the database structure is initialized.
    Mock CSV data loading has been removed.
    """
    print("\n" + "="*60)
    print("MedRetain CRM - Production Mode")
    print("Hospital HIMS synchronization will take over as patients arrive.")
    print("="*60 + "\n")

    # Local patients should already be in DB if synced by HIMS
    db = SessionLocal()
    try:
        patient_count = db.query(Patient).count()
        print(f"Current local CRM database has {patient_count} patients.")
        
        if patient_count > 0:
            print("Refreshing churn predictions for existing patients...")
            update_churn_predictions(db)
    finally:
        db.close()

def update_churn_predictions(db: Session):
    """
    Update churn predictions for all patients in the database.
    """
    try:
        patients = db.query(Patient).all()
        if not patients: return
        
        patient_data = []
        for patient in patients:
            patient_data.append({
                'patient_id': patient.patient_id,
                'days_since_last_visit': patient.days_since_last_visit or 30,
                'no_show_rate': patient.no_show_rate or 0,
                'total_appointments': patient.total_appointments or 0,
                'completed_visits': patient.completed_visits or 0,
                'satisfaction_score': patient.satisfaction_score or 3.0,
                'is_chronic': patient.is_chronic or 'No',
                'visit_frequency_per_year': patient.visit_frequency_per_year or 0
            })

        df = pd.DataFrame(patient_data)
        scores, labels = predict_batch(df)

        for i, patient in enumerate(patients):
            patient.churn_risk_score = float(scores[i])
            patient.churn_risk_label = str(labels[i])

        db.commit()
    except Exception as e:
        print(f"Error updating churn predictions: {e}")
        db.rollback()
