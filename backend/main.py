"""
MedRetain CRM - Main FastAPI Application
Hospital Patient Retention CRM System
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import asyncio

from .database import init_db, SessionLocal
from .models import Patient
from .data_loader import initialize_data
from .routers import patients, batches, messages, analytics, hims_auth
from .hims import webhooks
from .hims.scheduler import hims_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    # Startup
    print("\n" + "="*60)
    print("MedRetain CRM - Starting Application")
    print("="*60)

    # Initialize database tables
    print("\nInitializing database...")
    init_db()

    # Check if we should initialize with any bootstrap data
    initialize_data()

    # Start HIMS Background Polling Scheduler (The "Heartbeat")
    print("\nStarting HIMS Adaptive Layer Heartbeat...")
    asyncio.create_task(hims_scheduler.start())
    
    print("\nAPI Documentation available at /docs")
    print("\n" + "="*60)

    yield

    # Shutdown
    print("\nShutting down MedRetain CRM...")


# Create FastAPI app
app = FastAPI(
    title="MedRetain CRM API",
    description="Hospital Patient Retention CRM System with Churn Prediction",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS - Allowing all origins for deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(patients.router)
app.include_router(batches.router)
app.include_router(messages.router)
app.include_router(analytics.router)
app.include_router(hims_auth.router, tags=["HIMS-Auth"])
app.include_router(webhooks.router, tags=["HIMS-Webhooks"])


@app.get("/")
def root():
    """Root health check."""
    return {
        "message": "MedRetain CRM API",
        "version": "2.0.0",
        "status": "online"
    }


@app.get("/health")
def health_check():
    """Enhanced health check."""
    db = SessionLocal()
    try:
        patient_count = db.query(Patient).count()
        return {
            "status": "healthy",
            "database": "connected",
            "patient_count": patient_count
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
    finally:
        db.close()


if __name__ == "__main__":
    import uvicorn
    # Read PORT from environment for deployment
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=port,
        reload=False  # Re-loading disabled for production
    )
