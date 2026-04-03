# Tathya Retention Engine - Production Setup

The system has been fully migrated from a mock MVP to a production-ready architecture. All mock data has been removed, and the system now relies entirely on real-time HIMS synchronization.

## 🚀 Getting Started

### 1. Environment Configuration
Create a `.env` file in the root directory (one has been pre-created for you). Ensure the following are set:
- `ENCRYPTION_KEY`: A 32-byte Fernet key for securing hospital credentials.
- `TWILIO_ACCOUNT_SID` & `TWILIO_AUTH_TOKEN`: For WhatsApp messaging.
- `DATABASE_URL`: Your production database (PSQL/MySQL recommended).

### 2. First-Time Onboarding
1. Start the backend: `cd backend && uvicorn main:app --reload`
2. Start the frontend: `cd frontend && npm run dev`
3. Upon opening the app, you will be greeted by the **Connect your HIMS** screen.
4. Enter your Hospital ID and HIMS credentials (REST API or Direct DB).
5. The system will authenticate and securely store these credentials using AES-256 encryption.

## 🔄 Automated Retention Flow

The system now operates autonomously:
1. **Polling Scheduler**: Every hour, the `HIMSPollingScheduler` wakes up and checks all connected HIMS for recent activity.
2. **Dropout Detection**: It automatically identifies "No-Show" or "Cancelled" appointments from the HIMS.
3. **Data Sync**: When a dropout is found, it pulls the full patient profile from the HIMS and upserts it into the CRM database.
4. **AI Scoring**: The Gradient Boosting model immediately calculates a churn risk score for the patient.
5. **Automated WhatsApp**: If a patient is flagged as **High Risk**, the system automatically triggers a personalized WhatsApp re-engagement message via Twilio.

## 🛠 Maintenance
- Use the `/hims/connection-status` endpoint to check which hospitals are currently syncing.
- Logs are available in the terminal under the `uvicorn` logger.
- Churn models can be re-trained by calling the training script if local data grows significantly.

---
*Tathya - Secure, Automated, Patient-First.*
