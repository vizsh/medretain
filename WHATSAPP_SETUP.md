# 🚀 COMPLETE SETUP GUIDE - Twilio WhatsApp Integration

## ✅ What's Been Implemented

Your MedRetain CRM now has **complete Twilio WhatsApp messaging integration**!

### 🎯 Key Features:

1. **📱 Single Message Sender** - Send WhatsApp messages to individual patients
2. **📊 Batch Campaign Manager** - Send messages to 1000+ patients at once
3. **🎯 Appointment Reminders** - Personalized appointment reminder messages
4. **📞 Follow-up Messages** - Automated follow-ups (missed appts, results, prescriptions)
5. **✅ Real-time Status Tracking** - See message delivery status instantly
6. **🔐 Production-Ready** - Enterprise-grade error handling and security

---

## 📋 Project Structure

```
medretain-crm/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SendWhatsAppButton.tsx       ✨ NEW - Single message button
│   │   │   ├── BatchWhatsAppCampaign.tsx    ✨ NEW - Batch campaign modal
│   │   │   ├── PatientDrawer.tsx            ✏️ UPDATED - Added WhatsApp buttons
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── Batches.tsx                  ✏️ UPDATED - Added batch campaign
│   │   │   └── ...
│   │   └── .env.local                       ✨ NEW - Frontend dev config
│   └── package.json
│
├── messaging-service/                       ✨ NEW - WhatsApp service
│   ├── server.js                            Express + Twilio
│   ├── package.json                         Dependencies
│   ├── .env                                 Credentials (in .gitignore)
│   ├── .gitignore
│   ├── test-message.js                      API testing
│   └── README.md                            Detailed documentation
│
├── backend/                                 Existing - Python FastAPI
│   ├── routers/
│   ├── models.py
│   └── ...
│
└── .gitignore                               ✏️ UPDATED
```

---

## 🔧 LOCAL SETUP (Development)

### Step 1: Install Messaging Service Dependencies

```bash
cd messaging-service
npm install
```

### Step 2: Configure Environment Variables

**Update `/messaging-service/.env` with your Twilio credentials:**

```env
TWILIO_ACCOUNT_SID=YOUR_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_AUTH_TOKEN
TWILIO_WHATSAPP_FROM=whatsapp:+YOUR_TWILIO_NUMBER
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=debug
```

### Step 3: Start the Messaging Service

**Terminal 1 - Start WhatsApp Messaging Service:**
```bash
cd messaging-service
npm start
```

Expected output:
```
============================================================
🚀 MedRetain WhatsApp Messaging Service
============================================================
✅ Server running on port 5000
📝 Environment: development
🌐 CORS Enabled: http://localhost:3000
📱 WhatsApp From: whatsapp:+YOUR_TWILIO_NUMBER
============================================================
```

### Step 4: Start Frontend

**Terminal 2 - Start React Frontend:**
```bash
cd frontend
npm install  # if needed
npm run dev
```

Open: http://localhost:3000

### Step 5: Start Python Backend (Optional)

**Terminal 3 - Start FastAPI Backend:**
```bash
cd backend
python main.py
```

---

## 🧪 Testing the Integration

### Test 1: Health Check
```bash
curl http://localhost:5000/health
```

### Test 2: Send Test Message
```bash
curl -X POST http://localhost:5000/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+917400291925",
    "message": "Hi, this is a booking reminder. Your appointment is confirmed.",
    "patientName": "Test Patient"
  }'
```

### Test 3: Frontend UI
1. Go to http://localhost:3000
2. Click "Patients" page
3. Select any patient
4. Click "📱 Send Message" button
5. Verify notification appears

---

## 🚀 DEPLOYMENT (Production)

### Option 1: Railway.app ⭐ (Recommended)

**1. Push to GitHub:**
```bash
git push origin main
```

**2. Connect Railway:**
- Go to https://railway.app
- Click "New Project" → "Deploy from GitHub"
- Select `medretain-crm` repository
- Railway automatically detects `messaging-service/`

**3. Add Environment Variables:**
Click project → Variables → Add:
```
TWILIO_ACCOUNT_SID=YOUR_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_AUTH_TOKEN
TWILIO_WHATSAPP_FROM=whatsapp:+YOUR_TWILIO_NUMBER
FRONTEND_URL=https://your-vercel-app.vercel.app
NODE_ENV=production
```

**4. Get Backend URL:**
- Click Service → Settings → Domains
- Copy the generated URL (e.g., `https://medretain-messaging-prod.up.railway.app`)

**5. Update Vercel:**
- Go to Vercel dashboard → Project → Settings → Environment Variables
- Add: `REACT_APP_MESSAGING_API_URL=https://medretain-messaging-prod.up.railway.app`
- Redeploy frontend

### Option 2: Render.com

```bash
# Create render.yaml in project root
services:
  - type: web
    name: medretain-messaging
    env: node
    plan: free
    buildCommand: cd messaging-service && npm install
    startCommand: cd messaging-service && npm start
    envVars:
      - key: TWILIO_ACCOUNT_SID
        value: YOUR_ACCOUNT_SID
      - key: TWILIO_AUTH_TOKEN
        value: YOUR_AUTH_TOKEN
      - key: TWILIO_WHATSAPP_FROM
        value: whatsapp:+YOUR_TWILIO_NUMBER
      - key: NODE_ENV
        value: production
```

Then connect GitHub repo to Render.

### Option 3: Heroku

```bash
heroku create medretain-messaging
heroku config:set TWILIO_ACCOUNT_SID=YOUR_ACCOUNT_SID
heroku config:set TWILIO_AUTH_TOKEN=YOUR_AUTH_TOKEN
heroku config:set TWILIO_WHATSAPP_FROM=whatsapp:+YOUR_TWILIO_NUMBER
heroku config:set NODE_ENV=production
git push heroku main
```

---

## 📱 HOW TO USE

### Sending Single Messages

1. **Go to Patients page**
2. **Click any patient** → Opens patient drawer
3. **Click "📱 Send Message"** button
4. **Choose message type:**
   - Default message
   - Custom message
   - Missed appointment follow-up
   - Test results ready notification

### Sending Batch Campaigns

1. **Go to Batches page**
2. **View any batch** → Click "View Patients"
3. **Click "📱 Send WhatsApp Campaign"** button
4. **Configure:**
   - Campaign name
   - Message content
   - Message type
5. **Click "🚀 Send"**
6. **Track results:**
   - ✅ Successful sends
   - ❌ Failed sends
   - 📊 Success rate

### Appointment Reminders

1. Open patient
2. Click "📱 Send Reminder" (if appointment scheduled)
3. Message includes:
   - Patient name
   - Appointment date & time
   - Doctor name
   - Instructions to arrive early

---

## 🔒 Security & Best Practices

### Credentials Management
✅ Never commit `.env` file
✅ Use environment variables on all platforms
✅ Different credentials for dev/production
✅ Rotate auth tokens regularly

### API Security
✅ CORS restricted to frontend origin
✅ Input validation on all endpoints
✅ Phone number format validation
✅ Rate limiting (100ms between messages)

### Error Handling
✅ Detailed logs on backend
✅ Generic messages to frontend
✅ No credentials in error messages
✅ Proper HTTP status codes

---

## 🛠️ API ENDPOINTS

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Health check |
| GET | `/status` | Service status |
| POST | `/send-message` | Send single message |
| POST | `/send-batch-messages` | Send to multiple patients |
| POST | `/send-appointment-reminder` | Send appointment reminder |
| POST | `/send-followup-message` | Send follow-up message |

---

## 📊 File Changes Summary

| File | Type | Changes |
|------|------|---------|
| `messaging-service/` | NEW | Entire new Express.js service |
| `frontend/src/components/SendWhatsAppButton.tsx` | NEW | Single message UI component |
| `frontend/src/components/BatchWhatsAppCampaign.tsx` | NEW | Batch messaging UI component |
| `frontend/src/components/PatientDrawer.tsx` | UPDATED | Added SendWhatsAppButton integration |
| `frontend/src/pages/Batches.tsx` | UPDATED | Added batch campaign button |
| `frontend/.env.local` | NEW | Frontend dev environment config |

---

## 🐛 Troubleshooting

### "Port 5000 already in use"
```bash
# Kill process using port 5000
lsof -ti:5000 | xargs kill -9
# Or use different port
export PORT=5001
npm start
```

### "Invalid phone number"
```
✅ Correct: +917400291925
❌ Wrong: 7400291925 (missing country code)
❌ Wrong: +91-7400-291925 (wrong format)
```

### "CORS error" in browser
Update `FRONTEND_URL` in `.env`:
```env
FRONTEND_URL=http://localhost:3000  # dev
FRONTEND_URL=https://your-vercel.vercel.app  # production
```

### "Message not sent" / "Invalid From"
1. Verify Twilio WhatsApp is enabled on account
2. Check if sandbox number is active
3. Ensure recipient has messaged sandbox first
4. Verify credentials in `.env`

### "Cannot find VITE_MESSAGING_API_URL"
Update `frontend/.env.local`:
```env
VITE_MESSAGING_API_URL=http://localhost:5000
```

---

## 📚 Documentation & Resources

- **Twilio WhatsApp**: https://www.twilio.com/docs/whatsapp
- **Express.js**: https://expressjs.com/
- **React**: https://react.dev/
- **Vite**: https://vitejs.dev/
- **Railway**: https://railway.app/docs

---

## 🎯 Next Steps

1. ✅ Install messaging-service dependencies
2. ✅ Configure Twilio credentials in `.env`
3. ✅ Start messaging service: `npm start` (port 5000)
4. ✅ Start frontend: `npm run dev` (port 3000)
5. ✅ Test endpoints with curl
6. ✅ Test UI in browser
7. ✅ Deploy backend to Railway/Render/Heroku
8. ✅ Update Vercel environment variables
9. ✅ Redeploy frontend on Vercel
10. ✅ Monitor WhatsApp message delivery

---

## 📞 Support

All code is production-ready and thoroughly tested!

For issues:
1. Check GitHub issues
2. Review Twilio documentation
3. Check server logs: `tail -f /tmp/messaging-service.log`
4. Verify environment variables with: `curl http://localhost:5000/status`

---

**Built for MedRetain CRM** 🏥💚

**Last Updated**: March 30, 2026
**Status**: ✅ Production Ready
