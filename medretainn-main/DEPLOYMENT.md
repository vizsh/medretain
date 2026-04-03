# MedRetain CRM - Deployment Guide

This document lists all environment variables correctly read and required by the application for a successful production deployment.

## Backend Environment Variables

The backend is built with FastAPI and should be deployed via the provided `Procfile`.

| Variable | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `PORT` | The port the application will listen on. | Yes | `8000` |
| `DATABASE_URL` | SQLAlchemy connection string. | Yes | `sqlite:///./retention_crm.db` |
| `ENCRYPTION_KEY` | 32-byte Fernet key for securing HIMS credentials. | Yes | *Error if missing* |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID for WhatsApp messaging. | Yes | *None (Error if missing)* |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token for WhatsApp messaging. | Yes | *None (Error if missing)* |
| `TWILIO_WHATSAPP_FROM` | Twilio sandbox or production WhatsApp number. | Yes | `whatsapp:+14155238886` |
| `LOG_LEVEL` | Python logging level. | No | `INFO` |

### Database Specifics
For production (e.g., Render, Heroku, AWS), use **PostgreSQL**.
Example: `postgresql://user:password@host:port/dbname`

### Security Note
Generate a fresh `ENCRYPTION_KEY` for every environment:
```bash
python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'
```

---

## Frontend Environment Variables

The frontend is built with React/Vite. Ensure these are set in the CI/CD pipeline or `.env` file during the build process.

| Variable | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | The base URL of the backend API. | Yes | `/api` |

### Frontend Build Instruction
To build the frontend for static hosting (e.g., Vercel, Netlify):
```bash
npm install && npm run build
```

---

## Deployment Artifacts
- **Procfile**: Included for Heroku-compatible platforms.
- **main.py**: Configured to allow all CORS origins for easier cross-domain deployment.
- **uvicorn**: Starts with `0.0.0.0` host to be reachable externally.
