from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from datetime import datetime

class HIMSException(Exception):
    """Base exception for HIMS related errors."""
    pass

class AuthenticationError(HIMSException):
    """Raised when HIMS authentication fails."""
    pass

class SessionExpiredError(HIMSException):
    """Raised when a HIMS session has expired."""
    pass

class HIMSAdapter(ABC):
    """
    Abstract Base Class for HIMS (Hospital Information Management System) Adapters.
    Any new HIMS must implement these methods to be compatible with our retention logic.
    """

    @abstractmethod
    def fetch_recent_appointments(self, start_time: datetime, end_time: datetime) -> List[Dict[str, Any]]:
        """
        Gets a list of who visited or had appointments in the given timeframe.
        Returns a list of raw appointment data from the HIMS.
        """
        pass

    @abstractmethod
    def sync_patient_profile(self, patient_id: str) -> Dict[str, Any]:
        """
        Updates a patient's address, phone, and clinical history from the HIMS.
        Returns the raw patient record from the HIMS.
        """
        pass

    @abstractmethod
    def update_intervention_status(self, patient_id: str, intervention_type: str, status: str, details: Optional[str] = None) -> bool:
        """
        Tells the HIMS when a message has been sent or if the patient responded.
        Returns True if successful.
        """
        pass

    @abstractmethod
    def get_hims_name(self) -> str:
        """
        Returns the name of the HIMS (e.g., 'Doctor 24/7').
        """
        pass

    @abstractmethod
    def authenticate(self, credentials: Dict[str, Any]) -> Dict[str, Any]:
        """
        Authenticates with the HIMS using provided credentials.
        Returns a session dictionary with tokens or connection details.
        """
        pass

    @abstractmethod
    def validate_session(self, session: Dict[str, Any]) -> bool:
        """
        Validates if the provided session is still active/valid.
        """
        pass
