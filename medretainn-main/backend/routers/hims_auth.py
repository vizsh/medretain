from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
from ..hims.manager import get_hims_manager
from ..hims.interface import AuthenticationError
from ..database import SessionLocal
from ..models import HIMSConnection

router = APIRouter(prefix="/hims")

class HIMSConnectRequest(BaseModel):
    hospital_id: str
    hims_name: str
    credentials: Dict[str, Any]

class HIMSDisconnectResponse(BaseModel):
    hospital_id: str
    status: str

@router.post("/connect")
async def connect_hims(request: HIMSConnectRequest):
    """
    Connect a hospital to its HIMS with authentication and encrypted storage.
    """
    manager = get_hims_manager()
    
    # Validation
    if not request.hospital_id or not request.hims_name:
        raise HTTPException(status_code=400, detail="Missing hospital_id or hims_name.")
    
    try:
        # Authenticate and encrypt
        session = manager.connect_hospital(
            request.hospital_id,
            request.hims_name,
            request.credentials
        )
        return {
            "status": "success",
            "message": f"Successfully connected to {request.hims_name} for hospital {request.hospital_id}.",
            "session_type": session.get("type"),
            "authenticated_at": session.get("authenticated_at")
        }
    except AuthenticationError as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error connecting HIMS for hospital {request.hospital_id}: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred during connection.")

@router.delete("/disconnect/{hospital_id}")
async def disconnect_hims(hospital_id: str):
    """
    Disconnect a hospital's HIMS connection and disable its sync activity.
    """
    manager = get_hims_manager()
    
    try:
        success = manager.disconnect_hospital(hospital_id)
        if success:
            return {
                "hospital_id": hospital_id,
                "status": "disconnected"
            }
        else:
            raise HTTPException(status_code=404, detail=f"No HIMS connection found for hospital {hospital_id}")
    except Exception as e:
        print(f"Error disconnecting HIMS for hospital {hospital_id}: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred during disconnection.")
@router.get("/connection-status")
async def get_connection_status():
    """Returns the list of active HIMS connections."""
    db = SessionLocal()
    try:
        active_conns = db.query(HIMSConnection).filter(HIMSConnection.is_active == True).all()
        return {
            "connected": len(active_conns) > 0,
            "connections": [
                {"hospital_id": c.hospital_id, "hims_name": c.hims_name, "connected_at": c.created_at} 
                for c in active_conns
            ]
        }
    finally:
        db.close()
