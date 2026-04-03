import React, { useEffect, useState } from 'react';
import { getPatient, sendMessage, PatientDetail } from '../api';
import PatientNotes from './PatientNotes';
import ActionButton from './ActionButton';
import RiskBadge from './RiskBadge';
import SendWhatsAppButton from './SendWhatsAppButton';

interface PatientDrawerProps {
  patientId: string | null;
  onClose: () => void;
}

const PatientDrawer: React.FC<PatientDrawerProps> = ({ patientId, onClose }) => {
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageType, setMessageType] = useState('reminder');
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    if (patientId) {
      loadPatient();
    }
  }, [patientId]);

  const loadPatient = async () => {
    if (!patientId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getPatient(patientId);
      setPatient(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patient');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!patient) return;
    try {
      setSending(true);
      setSendError(null);
      await sendMessage({
        patient_id: patient.patient_id,
        message_type: messageType,
      });
      setSendSuccess(true);
      setTimeout(() => {
        setSendSuccess(false);
        setShowMessageModal(false);
        // Reload patient data to show updated last message info
        loadPatient();
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setSendError(errorMessage);
    } finally {
      setSending(false);
    }
  };

  if (!patientId) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 999,
          animation: 'fadeIn 0.3s ease',
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '600px',
          backgroundColor: '#0a0d12',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 1000,
          overflowY: 'auto',
          animation: 'slideInRight 0.3s ease',
        }}
      >
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>Loading patient details...</div>
          </div>
        ) : error ? (
          <div style={{ padding: '40px' }}>
            <div style={{ color: '#ff6b6b', marginBottom: '20px' }}>Error: {error}</div>
            <ActionButton onClick={onClose}>Close</ActionButton>
          </div>
        ) : patient ? (
          <>
            {/* Header */}
            <div
              style={{
                padding: '24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                backgroundColor: '#0a0d12',
                zIndex: 10,
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#fff' }}>
                  {patient.full_name}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#9ca3af' }}>
                  ID: {patient.patient_id}
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '8px',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Demographics Section */}
              <Section title="Demographics">
                <InfoRow label="Age" value={patient.age} />
                <InfoRow label="Gender" value={patient.gender} />
                <InfoRow label="Contact" value={patient.contact_number} />
                <InfoRow label="Email" value={patient.email} />
                <InfoRow label="Branch" value={patient.hospital_branch} />
                <InfoRow label="Segment" value={patient.patient_segment} />
              </Section>

              {/* Clinical Section */}
              <Section title="Clinical Information">
                <InfoRow label="Primary Condition" value={patient.primary_condition} />
                <InfoRow label="Chronic Condition" value={patient.is_chronic} />
                <InfoRow label="Primary Doctor" value={patient.primary_doctor_name} />
                <InfoRow label="Medical Record #" value={patient.medical_record_number} />
              </Section>

              {/* Visit History */}
              <Section title="Visit History">
                <InfoRow label="Last Visit" value={patient.days_since_last_visit ? `${patient.days_since_last_visit} days ago` : null} />
                <InfoRow label="Total Appointments" value={patient.total_appointments} />
                <InfoRow label="Completed Visits" value={patient.completed_visits} />
                <InfoRow label="No-Show Rate" value={patient.no_show_rate ? `${(patient.no_show_rate * 100).toFixed(1)}%` : null} />
                <InfoRow label="Visit Frequency/Year" value={patient.visit_frequency_per_year?.toFixed(1)} />
              </Section>

              {/* Financial Summary */}
              <Section title="Financial Summary">
                <InfoRow label="Total Billed" value={patient.total_billed ? `$${patient.total_billed.toLocaleString()}` : null} />
                <InfoRow label="Total Paid" value={patient.total_paid ? `$${patient.total_paid.toLocaleString()}` : null} />
                <InfoRow label="Outstanding Balance" value={patient.outstanding_balance ? `$${patient.outstanding_balance.toLocaleString()}` : null} />
                <InfoRow label="Insurance Provider" value={patient.insurance_provider} />
              </Section>

              {/* CRM Signals */}
              <Section title="CRM Signals">
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>Churn Risk Score</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '48px', fontWeight: 700, color: patient.churn_risk_score && patient.churn_risk_score >= 70 ? '#ff6b6b' : patient.churn_risk_score && patient.churn_risk_score >= 40 ? '#ffd166' : '#00d4a8' }}>
                      {patient.churn_risk_score?.toFixed(0) || 0}
                    </div>
                    <RiskBadge label={patient.churn_risk_label} />
                  </div>
                </div>
                <InfoRow label="Action Required" value={patient.crm_action_required} />
                <InfoRow label="WhatsApp Opt-in" value={patient.whatsapp_opt_in} />
                {patient.last_whatsapp_message_date && (
                  <>
                    <InfoRow
                      label="Last Message Sent"
                      value={new Date(patient.last_whatsapp_message_date).toLocaleDateString()}
                    />
                    <InfoRow
                      label="Message Status"
                      value={
                        <span style={{
                          padding: '4px 10px',
                          backgroundColor: patient.last_whatsapp_message_status === 'delivered' ? 'rgba(0, 212, 168, 0.2)' : patient.last_whatsapp_message_status === 'failed' ? 'rgba(255, 107, 107, 0.2)' : 'rgba(255, 209, 102, 0.2)',
                          color: patient.last_whatsapp_message_status === 'delivered' ? '#00d4a8' : patient.last_whatsapp_message_status === 'failed' ? '#ff6b6b' : '#ffd166',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}>
                          {patient.last_whatsapp_message_status || 'N/A'}
                        </span>
                      }
                    />
                  </>
                )}
                <InfoRow label="Satisfaction Score" value={patient.satisfaction_score ? `${patient.satisfaction_score.toFixed(1)}/5` : null} />
                <InfoRow label="NPS Score" value={patient.nps_score} />
              </Section>

              {/* Patient Notes & Activity Timeline */}
              <div style={{ marginBottom: '32px' }}>
                <PatientNotes patientId={patient.patient_id} />
              </div>

              {/* Send Message Button */}
              {patient.whatsapp_opt_in === 'Yes' && (
                <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <h4 style={{ margin: '0 0 16px', color: '#fff', fontSize: '16px', fontWeight: 600 }}>
                    📱 WhatsApp Actions
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                    <SendWhatsAppButton
                      patientPhone={patient.contact_number || undefined}
                      patientName={patient.full_name || 'Patient'}
                      messageType="default"
                      variant="primary"
                    />

                    <button
                      onClick={() => setShowMessageModal(true)}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: 'rgba(76, 201, 240, 0.1)',
                        border: '1px solid rgba(76, 201, 240, 0.3)',
                        borderRadius: '8px',
                        color: '#4cc9f0',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        justifyContent: 'center'
                      }}
                    >
                      ✏️ Custom Message
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <SendWhatsAppButton
                      patientPhone={patient.contact_number || undefined}
                      patientName={patient.full_name || 'Patient'}
                      messageType="followup"
                      reason="missed_appointment"
                      variant="secondary"
                    />

                    <SendWhatsAppButton
                      patientPhone={patient.contact_number || undefined}
                      patientName={patient.full_name || 'Patient'}
                      messageType="followup"
                      reason="pending_results"
                      variant="secondary"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>

      {/* Message Modal */}
      {showMessageModal && patient && (
        <>
          <div
            onClick={() => setShowMessageModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              zIndex: 1001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#141921',
              padding: '32px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              zIndex: 1002,
              minWidth: '400px',
            }}
          >
            <h3 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: 600, color: '#fff' }}>
              Send WhatsApp Message
            </h3>
            {sendSuccess ? (
              <div style={{ color: '#00d4a8', fontSize: '16px', padding: '20px 0' }}>
                ✓ Message sent successfully!
              </div>
            ) : (
              <>
                {sendError && (
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: 'rgba(255, 107, 107, 0.2)',
                      border: '1px solid rgba(255, 107, 107, 0.3)',
                      borderRadius: '6px',
                      color: '#ff6b6b',
                      fontSize: '14px',
                      marginBottom: '20px',
                    }}
                  >
                    {sendError}
                  </div>
                )}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', color: '#9ca3af', marginBottom: '8px' }}>
                    Message Type
                  </label>
                  <select
                    value={messageType}
                    onChange={(e) => setMessageType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      backgroundColor: '#0a0d12',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '14px',
                    }}
                  >
                    <option value="reminder">Appointment Reminder</option>
                    <option value="reengagement">Re-engagement</option>
                    <option value="followup">Follow-up Check</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowMessageModal(false)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      color: '#9ca3af',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    Cancel
                  </button>
                  <ActionButton onClick={handleSendMessage} loading={sending}>
                    {sending ? 'Sending...' : 'Send Message'}
                  </ActionButton>
                </div>
              </>
            )}
          </div>
        </>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}
      </style>
    </>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: '32px' }}>
    <h3
      style={{
        margin: '0 0 16px',
        fontSize: '14px',
        fontWeight: 600,
        color: '#00d4a8',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}
    >
      {title}
    </h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>{children}</div>
  </div>
);

const InfoRow: React.FC<{ label: string; value: any }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ fontSize: '14px', color: '#9ca3af' }}>{label}</span>
    <span style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>
      {value !== null && value !== undefined ? value : 'N/A'}
    </span>
  </div>
);

export default PatientDrawer;
