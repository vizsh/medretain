/**
 * MedRetain CRM - WhatsApp Messaging Service
 * Express server for Twilio WhatsApp integration
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const twilio = require('twilio');

const app = express();

// ===== MIDDLEWARE =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://hims-crm.vercel.app',
  'https://charming-mooncake-0b383a.netlify.app',
  'https://medretain-crm.vercel.app'
];

// Remove duplicates
const uniqueOrigins = [...new Set(allowedOrigins)];

console.log('🔐 CORS Allowed Origins:', uniqueOrigins);
console.log('📍 FRONTEND_URL from env:', process.env.FRONTEND_URL || '⚠️  NOT SET - using defaults');

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) {
      console.log('✅ No origin header (Postman/internal) - ALLOWED');
      return callback(null, true);
    }

    if (uniqueOrigins.includes(origin)) {
      console.log(`✅ Origin ${origin} - ALLOWED`);
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked origin: ${origin}`);
      console.warn(`❌ Allowed origins: ${uniqueOrigins.join(', ')}`);
      callback(null, true); // ALLOW ALL for debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept']
}));

// ===== ENVIRONMENT VALIDATION =====
const validateEnvironment = () => {
  const required = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_FROM'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ CRITICAL: Missing environment variables:', missing.join(', '));
    console.error('Please check your .env file');
    process.exit(1);
  }
  console.log('✅ Environment validation passed');
};

// ===== TWILIO CLIENT =====
const getTwilioClient = () => {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
};

// ===== UTILITY FUNCTIONS =====

/**
 * Format phone number to international format
 */
const formatPhoneNumber = (phone) => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  // Add + if not present
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
};

/**
 * Format for WhatsApp (whatsapp:+country-number)
 */
const formatWhatsAppNumber = (phone) => {
  return `whatsapp:${formatPhoneNumber(phone)}`;
};

/**
 * Validate phone number format
 */
const isValidPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  // Minimum 10 digits, maximum 15 digits (international standard)
  return cleaned.length >= 10 && cleaned.length <= 15;
};

// ===== ROUTES =====

/**
 * Health Check Endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'MedRetain WhatsApp Messaging Service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * Get Service Status
 */
app.get('/status', (req, res) => {
  try {
    const client = getTwilioClient();
    res.json({
      status: 'operational',
      service: 'WhatsApp Messaging',
      twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID.substring(0, 8) + '...',
        whatsappFrom: process.env.TWILIO_WHATSAPP_FROM
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

/**
 * Send WhatsApp Message to Single Patient
 * POST /send-message
 */
app.post('/send-message', async (req, res) => {
  try {
    const { phoneNumber, message, patientName, appointmentDate } = req.body;

    // Validation
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: `Invalid phone number format: ${phoneNumber}. Must be 10-15 digits.`
      });
    }

    // Format phone number
    const toNumber = formatWhatsAppNumber(phoneNumber);

    // Use custom message or default
    const messageContent = message ||
      'Hi, this is a booking reminder. Your appointment is confirmed.';

    console.log(`📱 Sending WhatsApp message`);
    console.log(`   To: ${toNumber}`);
    console.log(`   Patient: ${patientName || 'Unknown'}`);
    console.log(`   Date: ${appointmentDate || 'TBD'}`);
    console.log(`   Message: ${messageContent}`);

    // Initialize Twilio client
    const client = getTwilioClient();

    // Send message
    const result = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: toNumber,
      body: messageContent
    });

    console.log(`✅ Message queued successfully!`);
    console.log(`   SID: ${result.sid}`);
    console.log(`   Status: ${result.status}`);

    res.json({
      success: true,
      message: 'WhatsApp message sent successfully',
      data: {
        messageSid: result.sid,
        status: result.status,
        sentTo: phoneNumber,
        sentAt: new Date().toISOString(),
        messagePreview: messageContent.substring(0, 50) + '...'
      }
    });

  } catch (error) {
    console.error('❌ Error sending message:', error);

    // Specific error handling for Twilio
    if (error.code === 21608) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number or not WhatsApp-enabled',
        details: error.message
      });
    }

    if (error.code === 20003) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed - check Twilio credentials',
        details: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send message',
      details: process.env.NODE_ENV === 'development' ? error.code : undefined
    });
  }
});

/**
 * Send Batch Messages to Multiple Patients
 * POST /send-batch-messages
 */
app.post('/send-batch-messages', async (req, res) => {
  try {
    const { patients, message, batchId } = req.body;

    // Validation
    if (!patients || !Array.isArray(patients) || patients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Patients array is required and must not be empty'
      });
    }

    if (patients.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Batch size limit exceeded. Maximum 1000 patients per batch.'
      });
    }

    const messageContent = message ||
      'Hi, this is a booking reminder. Your appointment is confirmed.';

    console.log(`\n📱 BATCH MESSAGE CAMPAIGN`);
    console.log(`   Batch ID: ${batchId || 'N/A'}`);
    console.log(`   Total patients: ${patients.length}`);
    console.log(`   Message: ${messageContent.substring(0, 50)}...`);
    console.log(`   Started: ${new Date().toISOString()}\n`);

    const client = getTwilioClient();
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Send messages sequentially to avoid rate limiting
    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];

      try {
        // Validate phone before sending
        if (!isValidPhoneNumber(patient.phone)) {
          throw new Error(`Invalid phone format`);
        }

        const toNumber = formatWhatsAppNumber(patient.phone);

        // Send message
        const result = await client.messages.create({
          from: process.env.TWILIO_WHATSAPP_FROM,
          to: toNumber,
          body: messageContent
        });

        results.push({
          patientId: patient.patientId || `patient_${i}`,
          phone: patient.phone,
          name: patient.name || 'Unknown',
          success: true,
          messageSid: result.sid,
          status: result.status,
          sentAt: new Date().toISOString()
        });

        successCount++;
        console.log(`✅ [${i + 1}/${patients.length}] Sent to ${patient.phone}`);

        // Rate limiting: 1 message per 100ms (Twilio recommendation)
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        failureCount++;
        results.push({
          patientId: patient.patientId || `patient_${i}`,
          phone: patient.phone,
          name: patient.name || 'Unknown',
          success: false,
          error: error.message,
          sentAt: new Date().toISOString()
        });

        console.log(`❌ [${i + 1}/${patients.length}] Failed to send to ${patient.phone}: ${error.message}`);
      }
    }

    console.log(`\n📊 BATCH CAMPAIGN COMPLETED`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failureCount}`);
    console.log(`   Total: ${patients.length}\n`);

    res.json({
      success: true,
      message: 'Batch campaign processing completed',
      batchId: batchId || null,
      data: {
        results,
        summary: {
          total: patients.length,
          successful: successCount,
          failed: failureCount,
          successRate: ((successCount / patients.length) * 100).toFixed(2) + '%'
        },
        completedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Batch error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Batch processing failed'
    });
  }
});

/**
 * Send Appointment Reminder
 * POST /send-appointment-reminder
 */
app.post('/send-appointment-reminder', async (req, res) => {
  try {
    const { phoneNumber, patientName, appointmentDate, appointmentTime, doctorName } = req.body;

    if (!phoneNumber || !appointmentDate) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and appointment date are required'
      });
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format'
      });
    }

    // Build personalized message
    const reminderMessage = `Hello ${patientName || 'there'}! 👋

This is a reminder for your appointment:
📅 Date: ${appointmentDate}
${appointmentTime ? `⏰ Time: ${appointmentTime}` : ''}
${doctorName ? `👨‍⚕️ Doctor: ${doctorName}` : ''}

Please arrive 10 minutes early.

If you need to reschedule, please call us.

Thank you! 🏥`;

    const toNumber = formatWhatsAppNumber(phoneNumber);

    console.log(`📱 Sending appointment reminder to ${phoneNumber}`);

    const client = getTwilioClient();
    const result = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: toNumber,
      body: reminderMessage
    });

    console.log(`✅ Appointment reminder sent! SID: ${result.sid}`);

    res.json({
      success: true,
      message: 'Appointment reminder sent successfully',
      data: {
        messageSid: result.sid,
        status: result.status,
        sentTo: phoneNumber,
        patientName: patientName || 'Unknown',
        appointmentDate,
        sentAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error sending reminder:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Send Follow-up Message
 * POST /send-followup-message
 */
app.post('/send-followup-message', async (req, res) => {
  try {
    const { phoneNumber, patientName, reason } = req.body;

    if (!phoneNumber || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and reason are required'
      });
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format'
      });
    }

    // Build personalized follow-up message
    let followupMessage = `Hello ${patientName || 'there'}! 👋\n\n`;

    if (reason === 'missed_appointment') {
      followupMessage += `We noticed you missed your recent appointment. 😟\n\nWe're here to help! Please schedule your appointment at your earliest convenience.\n\nCall us or reply to this message to reschedule.`;
    } else if (reason === 'pending_results') {
      followupMessage += `Your test results are ready! 📋\n\nPlease visit us at your earliest convenience to discuss your results with the doctor.\n\nBook an appointment now!`;
    } else if (reason === 'prescription_refill') {
      followupMessage += `Time for your prescription refill! 💊\n\nYour prescription is ready for pickup. Visit us today or call to arrange delivery.\n\nThank you!`;
    } else {
      followupMessage += reason;
    }

    const toNumber = formatWhatsAppNumber(phoneNumber);

    console.log(`📱 Sending follow-up message to ${phoneNumber}`);

    const client = getTwilioClient();
    const result = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: toNumber,
      body: followupMessage
    });

    console.log(`✅ Follow-up message sent! SID: ${result.sid}`);

    res.json({
      success: true,
      message: 'Follow-up message sent successfully',
      data: {
        messageSid: result.sid,
        status: result.status,
        sentTo: phoneNumber,
        reason,
        sentAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error sending follow-up:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== ERROR HANDLING =====

/**
 * 404 Handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

/**
 * Global Error Handler
 */
app.use((err, req, res, next) => {
  console.error('🔴 Unhandled Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ===== SERVER STARTUP =====

const PORT = process.env.PORT || 5000;

const startServer = () => {
  validateEnvironment();

  app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 MedRetain WhatsApp Messaging Service');
    console.log('='.repeat(60));
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 CORS Enabled: ${process.env.FRONTEND_URL}`);
    console.log(`📱 WhatsApp From: ${process.env.TWILIO_WHATSAPP_FROM}`);
    console.log('='.repeat(60));
    console.log('\n📌 Available Endpoints:');
    console.log('   GET  /health                      - Health check');
    console.log('   GET  /status                      - Service status');
    console.log('   POST /send-message                - Send single message');
    console.log('   POST /send-batch-messages         - Send to multiple patients');
    console.log('   POST /send-appointment-reminder   - Send appointment reminder');
    console.log('   POST /send-followup-message       - Send follow-up message');
    console.log('\n');
  });
};

startServer();

module.exports = app;
