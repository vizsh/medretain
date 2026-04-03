from typing import Dict, Any, List
from datetime import datetime

class DataMapper:
    """
    Standardizes raw JSON from different HIMS into our internal format.
    Ensures our core logic always gets the same structure.
    """

    @staticmethod
    def map_doctor247_patient(raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalizes Doctor 24/7 patient JSON to our standard Format.
        """
        return {
            "patient_id": raw_data.get("p_id"),
            "full_name": raw_data.get("p_name"),
            "gender": raw_data.get("p_gender"),
            "age": raw_data.get("p_age"),
            "contact_number": raw_data.get("p_contact"),
            "address": raw_data.get("p_address"),
            "medical_history": raw_data.get("p_clinical_history", []),
            "last_visit_date": raw_data.get("p_last_visit"),
            "hims_source": "doctor247"
        }

    @staticmethod
    def map_instahealth_patient(raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalizes InstaHealth patient JSON to our standard Format.
        """
        return {
            "patient_id": raw_data.get("patient_uid"),
            "full_name": raw_data.get("patient_full_name"),
            "gender": raw_data.get("sex"),
            "age": raw_data.get("years_old"),
            "contact_number": raw_data.get("mobile_number"),
            "address": raw_data.get("location"),
            "medical_history": raw_data.get("comorbidities", []),
            "last_visit_date": raw_data.get("last_encounter"),
            "hims_source": "instahealth"
        }

    @staticmethod
    def map_appointment(raw_data: Dict[str, Any], hims_type: str) -> Dict[str, Any]:
        """
        Normalizes appointment data across any HIMS.
        """
        if hims_type == "doctor247":
            return {
                "appointment_id": raw_data.get("apt_id"),
                "patient_id": raw_data.get("p_id"),
                "patient_name": raw_data.get("p_name"),
                "scheduled_at": raw_data.get("apt_time"),
                "doctor_name": raw_data.get("doc_name"),
                "status": raw_data.get("apt_status")
            }
        # Add other HIMS mappings here as needed
        return raw_data
