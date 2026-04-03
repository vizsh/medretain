import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import KPICards from '../components/KPICards';
import PatientTable from '../components/PatientTable';
import PatientDrawer from '../components/PatientDrawer';
import { getSummary, AnalyticsSummary } from '../api';

const Dashboard: React.FC = () => {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load summary for high-risk alert
    loadSummary();

    // Update timestamp every 60 seconds
    const timer = setInterval(() => {
      setLastUpdated(new Date());
      loadSummary(); // Refresh data too
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const loadSummary = async () => {
    try {
      const data = await getSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  };

  const formatLastUpdated = () => {
    return lastUpdated.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const showHighRiskAlert = summary && summary.high_risk_count > 50;

  return (
    <div>
      {/* Header with live timestamp */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: '32px', fontWeight: 700, color: '#fff' }}>
            Dashboard
          </h1>
          <p style={{ margin: '0', fontSize: '16px', color: '#9ca3af' }}>
            Overview of patient retention metrics and at-risk patients
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
            Last updated
          </div>
          <div style={{
            fontSize: '14px',
            color: '#00d4a8',
            fontWeight: 600,
            fontFamily: 'monospace'
          }}>
            {formatLastUpdated()}
          </div>
        </div>
      </div>

      {/* High Risk Alert Banner */}
      {showHighRiskAlert && (
        <div
          style={{
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <span style={{ color: '#ff6b6b', fontSize: '16px', fontWeight: 600 }}>
              {summary!.high_risk_count} patients are at high churn risk. Request a batch to start outreach.
            </span>
          </div>
          <button
            onClick={() => navigate('/batches')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ff6b6b',
              color: '#0a0d12',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            Create Batch
          </button>
        </div>
      )}

      <KPICards />

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 600, color: '#fff' }}>
          Recent Patients
        </h2>
      </div>

      <PatientTable
        onPatientClick={(patient) => setSelectedPatientId(patient.patient_id)}
        onSendMessage={() => {}}
      />

      <PatientDrawer
        patientId={selectedPatientId}
        onClose={() => setSelectedPatientId(null)}
      />
    </div>
  );
};

export default Dashboard;
