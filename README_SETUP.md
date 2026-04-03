# MedRetain CRM - Setup & Installation Guide

## Overview
MedRetain is a hospital patient retention CRM system with AI-powered churn prediction using Python, FastAPI, SQLAlchemy, and scikit-learn.

## Prerequisites
- Python 3.11 or higher
- pip (Python package manager)
- Git (optional)

## Installation Steps

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Edit the `.env` file in the project root and add your Twilio credentials:
```
TWILIO_ACCOUNT_SID=your_actual_sid_here
TWILIO_AUTH_TOKEN=your_actual_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
DATABASE_URL=sqlite:///./medretain.db
```

### 3. Train the ML Model (Optional - First Time)
Before starting the server, you can optionally train the churn prediction model:
```bash
cd backend
python -m ml.train
```

Note: The model will be automatically trained when data is loaded if not already trained.

### 4. Start the Server
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Or simply:
```bash
cd backend
python main.py
```

The server will automatically:
- Initialize the database
- Create all tables
- Load patient data from `data/hospital_crm_master.csv` (if database is empty)
- Train and apply the churn prediction model

### 5. Access the API
Once started, you can access:
- **API Root**: http://localhost:8000/
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## Project Structure
```
medretain-crm/
├── backend/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── database.py             # Database configuration
│   ├── models.py               # SQLAlchemy ORM models
│   ├── schemas.py              # Pydantic schemas
│   ├── data_loader.py          # CSV data loader
│   ├── requirements.txt        # Python dependencies
│   ├── ml/
│   │   ├── __init__.py
│   │   ├── churn_model.py      # ML model implementation
│   │   └── train.py            # Model training script
│   └── routers/
│       ├── __init__.py
│       ├── patients.py         # Patient endpoints
│       ├── batches.py          # Batch management endpoints
│       ├── messages.py         # WhatsApp messaging endpoints
│       └── analytics.py        # Analytics endpoints
├── data/
│   └── hospital_crm_master.csv # Patient data (2200 records)
├── .env                         # Environment configuration
└── README_SETUP.md             # This file
```

## API Endpoints

### Patients
- `GET /patients` - List patients (paginated, filterable)
- `GET /patients/{patient_id}` - Get patient details
- `PUT /patients/{patient_id}/action` - Update patient CRM action

### Batches
- `POST /batches` - Create new patient batch (unseen patients only)
- `GET /batches` - List all batches
- `GET /batches/{batch_id}/patients` - Get patients in a batch
- `POST /batches/{batch_id}/patients/{patient_id}/action` - Mark patient as actioned

### Messages
- `POST /messages/send` - Send WhatsApp message to patient
- `GET /messages/{patient_id}` - Get patient message history

### Analytics
- `GET /analytics/summary` - Get analytics summary
- `GET /analytics/retention-trend` - Get retention trend (12 months)
- `GET /analytics/churn-distribution` - Get churn score distribution
- `GET /analytics/branch-performance` - Get branch performance metrics
- `GET /analytics/engagement-metrics` - Get patient engagement metrics

## Features

### 1. AI-Powered Churn Prediction
- GradientBoostingClassifier trained on 7 key features
- Predicts churn risk scores (0-100) and labels (Low/Medium/High)
- Automatic retraining capability

### 2. Dynamic Patient Batching
- Create batches of unseen patients matching specific criteria
- Prevents duplicate patient contact
- Track action status per patient per batch

### 3. WhatsApp Messaging via Twilio
- Send automated messages to patients
- Multiple message types (appointment reminders, feedback requests, etc.)
- Delivery status tracking
- Respects WhatsApp opt-in preferences

### 4. Comprehensive Analytics
- Patient segmentation and risk analysis
- Retention trends over time
- Branch performance comparison
- Engagement metrics

### 5. Full CRUD Operations
- Complete patient management
- Filter by risk level, segment, branch, chronic status
- Pagination support
- Update CRM actions

## Database Schema

### Patient Table
56 columns including demographics, medical info, churn metrics, visit data, financial data, satisfaction scores, communication preferences, and more.

### PatientBatch Table
Tracks batches of patients for CRM campaigns.

### BatchPatient Table
Links patients to batches with action tracking.

### MessageLog Table
Logs all WhatsApp messages sent to patients.

## Development Notes

- SQLite database (easily swappable for PostgreSQL/MySQL)
- CORS enabled for localhost:3000
- Auto-reload enabled in development mode
- Comprehensive error handling
- Twilio sandbox support for WhatsApp testing

## Troubleshooting

### Database Issues
- Delete `medretain.db` and restart to recreate from CSV

### Model Training Issues
- Ensure `data/hospital_crm_master.csv` exists and is readable
- Check that all required columns are present

### Twilio Issues
- Verify credentials in `.env` file
- Ensure WhatsApp sandbox is set up in Twilio console
- Check phone number formatting

## Next Steps
1. Configure Twilio credentials in `.env`
2. Start the server
3. Access the API documentation at http://localhost:8000/docs
4. Test endpoints using the Swagger UI
5. Build your frontend to consume the API

## Support
For issues or questions, refer to the API documentation at `/docs` or `/redoc`.
