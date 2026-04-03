# 📱 MedRetain WhatsApp Messaging Service - Setup Guide

## Quick Start

This is a **Node.js/Express** server that integrates **Twilio WhatsApp** messaging with the MedRetain CRM.

### Prerequisites

- **Node.js** v16+ and npm
- **Twilio Account** with WhatsApp enabled
- **Active Twilio WhatsApp Credentials** (Account SID, Auth Token, From Number)

---

## 🚀 Installation & Setup

### 1. Install Dependencies

```bash
cd messaging-service
npm install
```

### 2. Configure Environment Variables

Create/update `.env` file with your Twilio credentials:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=YOUR_ACCOUNT_SID_HERE
TWILIO_AUTH_TOKEN=YOUR_AUTH_TOKEN_HERE
TWILIO_WHATSAPP_FROM=whatsapp:+YOUR_TWILIO_NUMBER

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend CORS
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

**⚠️ Security:** Never commit `.env` to git. It's already in `.gitignore`.

### 3. Start the Server

**Development Mode (with auto-reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

**Expected Output:**
```
============================================================
🚀 MedRetain WhatsApp Messaging Service
============================================================
✅ Server running on port 5000
📝 Environment: development
🌐 CORS Enabled: http://localhost:3000
📱 WhatsApp From: whatsapp:+YOUR_TWILIO_NUMBER
============================================================

📌 Available Endpoints:
   GET  /health                      - Health check
   GET  /status                      - Service status
   POST /send-message                - Send single message
   POST /send-batch-messages         - Send to multiple patients
   POST /send-appointment-reminder   - Send appointment reminder
   POST /send-followup-message       - Send follow-up message
```

### 4. Test the Server

```bash
# In another terminal, run tests
npm test
```

Or manually test with curl:

```bash
# Health check
curl http://localhost:5000/health

# Send test message
curl -X POST http://localhost:5000/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+917400291925",
    "message": "Hi, this is a booking reminder. Your appointment is confirmed.",
    "patientName": "Test Patient"
  }'
```

---

## 📡 API Endpoints

### **GET /health**
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "MedRetain WhatsApp Messaging Service",
  "version": "1.0.0",
  "timestamp": "2024-03-29T12:00:00.000Z"
}
```

---

### **GET /status**
Service status with Twilio connection status.

**Response:**
```json
{
  "status": "operational",
  "service": "WhatsApp Messaging",
  "twilio": {
    "accountSid": "AC028b50...",
    "whatsappFrom": "whatsapp:+YOUR_TWILIO_NUMBER"
  },
  "environment": "development",
  "timestamp": "2024-03-29T12:00:00.000Z"
}
```

---

### **POST /send-message**
Send WhatsApp message to a single patient.

**Request Body:**
```json
{
  "phoneNumber": "+917400291925",
  "message": "Hi, this is a booking reminder. Your appointment is confirmed.",
  "patientName": "Raj Kumar",
  "appointmentDate": "2024-03-30"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "WhatsApp message sent successfully",
  "data": {
    "messageSid": "SM95...",
    "status": "queued",
    "sentTo": "+917400291925",
    "sentAt": "2024-03-29T12:00:00.000Z",
    "messagePreview": "Hi, this is a booking reminder..."
  }
}
```

---

### **POST /send-batch-messages**
Send messages to multiple patients at once.

**Request Body:**
```json
{
  "batchId": "batch_march_reminders",
  "message": "Your appointment is confirmed!",
  "patients": [
    {
      "patientId": "P001",
      "phone": "+917400291925",
      "name": "Raj Kumar"
    },
    {
      "patientId": "P002",
      "phone": "+919876543210",
      "name": "Priya Singh"
    }
  ]
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Batch campaign processing completed",
  "batchId": "batch_march_reminders",
  "data": {
    "results": [
      {
        "patientId": "P001",
        "phone": "+917400291925",
        "name": "Raj Kumar",
        "success": true,
        "messageSid": "SM95...",
        "status": "queued",
        "sentAt": "2024-03-29T12:00:00.000Z"
      }
    ],
    "summary": {
      "total": 2,
      "successful": 2,
      "failed": 0,
      "successRate": "100%"
    },
    "completedAt": "2024-03-29T12:00:05.000Z"
  }
}
```

---

### **POST /send-appointment-reminder**
Send personalized appointment reminder.

**Request Body:**
```json
{
  "phoneNumber": "+917400291925",
  "patientName": "Raj Kumar",
  "appointmentDate": "2024-03-30",
  "appointmentTime": "2:00 PM",
  "doctorName": "Dr. Sharma"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Appointment reminder sent successfully",
  "data": {
    "messageSid": "SM95...",
    "status": "queued",
    "sentTo": "+917400291925",
    "patientName": "Raj Kumar",
    "appointmentDate": "2024-03-30",
    "sentAt": "2024-03-29T12:00:00.000Z"
  }
}
```

---

### **POST /send-followup-message**
Send follow-up messages for missed appointments, results, etc.

**Request Body:**
```json
{
  "phoneNumber": "+917400291925",
  "patientName": "Raj Kumar",
  "reason": "missed_appointment"
}
```

**Supported Reasons:**
- `missed_appointment` - Missed appointment follow-up
- `pending_results` - Test results ready
- `prescription_refill` - Prescription refill reminder
- Custom message text

**Response (Success):**
```json
{
  "success": true,
  "message": "Follow-up message sent successfully",
  "data": {
    "messageSid": "SM95...",
    "status": "queued",
    "sentTo": "+917400291925",
    "reason": "missed_appointment",
    "sentAt": "2024-03-29T12:00:00.000Z"
  }
}
```

---

## 🔧 Frontend Integration

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Update Environment File

Create/update `.env.local`:

```env
REACT_APP_MESSAGING_API_URL=http://localhost:5000
REACT_APP_API_URL=http://localhost:8000
```

### 3. Use Components

#### Single Message Button
```tsx
import SendWhatsAppButton from './components/SendWhatsAppButton';

<SendWhatsAppButton
  patientPhone="+917400291925"
  patientName="Raj Kumar"
  messageType="default"
  variant="primary"
/>
```

#### Batch Campaign Modal
```tsx
import BatchWhatsAppCampaign from './components/BatchWhatsAppCampaign';

const [showBatch, setShowBatch] = useState(false);

<BatchWhatsAppCampaign
  isOpen={showBatch}
  onClose={() => setShowBatch(false)}
  patients={[
    { patientId: 'P001', phone: '+917400291925', name: 'Raj Kumar' },
    { patientId: 'P002', phone: '+919876543210', name: 'Priya Singh' }
  ]}
/>
```

---

## 📊 Complete Architecture

```
┌─────────────────────────────────────────────────────┐
│          MedRetain CRM (Frontend - React)           │
│                   (Vercel)                          │
└──────────────┬──────────────────────────────────────┘
               │
        POST /send-message
        POST /send-batch-messages
        POST /send-appointment-reminder
        POST /send-followup-message
               │
┌──────────────▼──────────────────────────────────────┐
│   WhatsApp Messaging Service (Express Node.js)      │
│          (Railway/Render/Heroku)                    │
└──────────────┬──────────────────────────────────────┘
               │
         Twilio SDK
               │
┌──────────────▼──────────────────────────────────────┐
│          Twilio WhatsApp API                        │
│   (International WhatsApp Delivery)                 │
└──────────────┬──────────────────────────────────────┘
               │
        WhatsApp Message
               │
┌──────────────▼──────────────────────────────────────┐
│      Patient's WhatsApp Phone                       │
│        +917400291925                                │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment

### Option 1: Railway.app (Recommended)

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Connect Railway:**
   - Go to https://railway.app
   - Connect GitHub repo
   - Railway auto-deploys

3. **Add Environment Variables in Railway:**
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_WHATSAPP_FROM`
   - `FRONTEND_URL` (your Vercel URL)
   - `NODE_ENV=production`

4. **Get Backend URL:**
   ```
   https://your-railway-project.up.railway.app
   ```

### Option 2: Render.com

1. Create `render.yaml` in project root
2. Connect GitHub
3. Deploy (auto-deploys on push)

### Option 3: Heroku

```bash
heroku create medretain-messaging
heroku config:set TWILIO_ACCOUNT_SID=YOUR_ACCOUNT_SID
heroku config:set TWILIO_AUTH_TOKEN=YOUR_AUTH_TOKEN
heroku config:set TWILIO_WHATSAPP_FROM=whatsapp:+YOUR_TWILIO_NUMBER
heroku config:set FRONTEND_URL=https://your-vercel-app.vercel.app
git push heroku main
```

### Update Frontend

Once deployed, update Vercel environment variables:

```
REACT_APP_MESSAGING_API_URL=https://your-backend-url.com
```

---

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Manual API Testing

```bash
# In messaging-service directory

# Test health
curl http://localhost:5000/health

# Test send message
curl -X POST http://localhost:5000/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+917400291925",
    "message": "Test message",
    "patientName": "Test"
  }'
```

### Integration Testing

1. Start both services:
   ```bash
   # Terminal 1
   cd messaging-service && npm run dev

   # Terminal 2
   cd frontend && npm run dev
   ```

2. Open http://localhost:3000
3. Click "Send Message" button on any patient
4. Check WhatsApp for delivered message

---

## 🔒 Security Checklist

✅ **Credentials:**
- [x] Never hardcode credentials
- [x] Use `.env` (not committed)
- [x] Different credentials for dev/prod

✅ **CORS:**
- [x] Only allow specific frontend URL
- [x] No `*` in production

✅ **Input Validation:**
- [x] Validate phone numbers
- [x] Limit message length
- [x] Check authentication (add if needed)

✅ **Error Handling:**
- [x] Don't expose stack traces
- [x] Log errors on backend
- [x] Generic messages to frontend

---

## 📞 Troubleshooting

### "Connection refused" error
**Solution:** Make sure Node server is running on port 5000
```bash
npm run dev
```

### "Invalid phone number" error
**Solution:** Phone number must be 10-15 digits with country code
```
✅ +917400291925 (correct)
❌ 7400291925 (missing country code)
❌ +91-7400-291925 (invalid format)
```

### "Authentication failed" error
**Solution:** Check Twilio credentials in `.env`
```bash
# Verify credentials
curl http://localhost:5000/status
```

### "CORS error" in browser console
**Solution:** Update `FRONTEND_URL` in `.env`
```env
FRONTEND_URL=http://localhost:3000  # development
# or
FRONTEND_URL=https://your-vercel-app.vercel.app  # production
```

### "Message not delivered"
**Solution:**
1. Verify phone number has WhatsApp enabled
2. Check Twilio account has WhatsApp sandbox active
3. Confirm recipient has messaged the sandbox number

---

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio Account ID | `AC...` |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | (hidden) |
| `TWILIO_WHATSAPP_FROM` | WhatsApp Sender Number | `whatsapp:+YOUR_TWILIO_NUMBER` |
| `PORT` | Server Port | `5000` |
| `NODE_ENV` | Environment | `development` or `production` |
| `FRONTEND_URL` | Frontend Origin | `http://localhost:3000` |
| `LOG_LEVEL` | Logging Level | `debug`, `info`, `warn`, `error` |

---

## 📚 Documentation Links

- [Twilio WhatsApp API Docs](https://www.twilio.com/docs/whatsapp)
- [Express Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)

---

## 🎯 Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Configure `.env` with Twilio credentials
3. ✅ Start server: `npm run dev`
4. ✅ Test endpoints: `npm test`
5. ✅ Integrate frontend components
6. ✅ Deploy to production

---

**Built for MedRetain CRM** 🏥💚
