import React, { useEffect, useState } from 'react';
import { getPatients, PatientsResponse, Patient, PatientFilters } from '../api';
import RiskBadge from './RiskBadge';
import ActionButton from './ActionButton';

interface PatientTableProps {
  onPatientClick: (patient: Patient) => void;
  onSendMessage: (patient: Patient) => void;
}

const PatientTable: React.FC<PatientTableProps> = ({ onPatientClick, onSendMessage }) => {
  const [data, setData] = useState<PatientsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PatientFilters>({ page: 1, page_size: 50 });
  const [searchName, setSearchName] = useState('');

  useEffect(() => {
    loadPatients();
  }, [filters]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const result = await getPatients(filters);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof PatientFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const getChurnBarColor = (score: number | null) => {
    if (!score) return '#666';

    // Color interpolation: green (0-40) → amber (40-70) → red (70-100)
    if (score <= 40) {
      // Interpolate from green to amber
      const ratio = score / 40;
      const r = Math.round(0 + (255 - 0) * ratio);
      const g = Math.round(212 + (209 - 212) * ratio);
      const b = Math.round(168 + (102 - 168) * ratio);
      return `rgb(${r}, ${g}, ${b})`;
    } else if (score <= 70) {
      // Interpolate from amber to red
      const ratio = (score - 40) / 30;
      const r = Math.round(255 + (255 - 255) * ratio);
      const g = Math.round(209 + (107 - 209) * ratio);
      const b = Math.round(102 + (107 - 102) * ratio);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      return '#ff6b6b'; // Pure red for high scores
    }
  };

  const getDaysVisitIndicator = (days: number | null) => {
    if (!days) return { color: '#666', label: 'No data' };

    if (days < 30) return { color: '#00d4a8', label: 'Recent' };
    if (days <= 90) return { color: '#ffd166', label: 'Overdue' };
    return { color: '#ff6b6b', label: 'Critical' };
  };

  const exportToCSV = () => {
    if (!data?.patients.length) return;

    const csvHeaders = [
      'Patient ID', 'Name', 'Age', 'Gender', 'Condition', 'Days Since Visit',
      'Churn Score', 'Risk Level', 'Segment', 'WhatsApp Opt-in', 'Contact Number'
    ];

    const csvData = filteredPatients.map(patient => [
      patient.patient_id,
      patient.full_name || '',
      patient.age || '',
      patient.gender || '',
      patient.primary_condition || '',
      patient.days_since_last_visit || '',
      patient.churn_risk_score || '',
      patient.churn_risk_label || '',
      patient.patient_segment || '',
      patient.whatsapp_opt_in || '',
      patient.contact_number || ''
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `patients_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return (
      <div
        style={{
          backgroundColor: '#141921',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 107, 107, 0.3)',
          color: '#ff6b6b',
        }}
      >
        Error: {error}
      </div>
    );
  }

  const filteredPatients = data?.patients.filter((p) =>
    searchName ? p.full_name?.toLowerCase().includes(searchName.toLowerCase()) : true
  ) || [];

  return (
    <div>
      {/* Filter Bar */}
      <div
        style={{
          backgroundColor: '#141921',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '20px',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder="Search by name..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '10px 14px',
            backgroundColor: '#0a0d12',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '14px',
          }}
        />
        <select
          value={filters.churn_risk_label || ''}
          onChange={(e) => handleFilterChange('churn_risk_label', e.target.value)}
          style={{
            padding: '10px 14px',
            backgroundColor: '#0a0d12',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '14px',
          }}
        >
          <option value="">All Risk Levels</option>
          <option value="High">High Risk</option>
          <option value="Medium">Medium Risk</option>
          <option value="Low">Low Risk</option>
        </select>
        <select
          value={filters.patient_segment || ''}
          onChange={(e) => handleFilterChange('patient_segment', e.target.value)}
          style={{
            padding: '10px 14px',
            backgroundColor: '#0a0d12',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '14px',
          }}
        >
          <option value="">All Segments</option>
          <option value="VIP">VIP</option>
          <option value="Regular">Regular</option>
          <option value="New">New</option>
        </select>
        <select
          value={filters.hospital_branch || ''}
          onChange={(e) => handleFilterChange('hospital_branch', e.target.value)}
          style={{
            padding: '10px 14px',
            backgroundColor: '#0a0d12',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '14px',
          }}
        >
          <option value="">All Branches</option>
          <option value="Main Hospital">Main Hospital</option>
          <option value="North Branch">North Branch</option>
          <option value="South Branch">South Branch</option>
        </select>

        {/* Export CSV Button */}
        <button
          onClick={exportToCSV}
          disabled={!data?.patients.length}
          style={{
            padding: '10px 16px',
            backgroundColor: data?.patients.length ? '#00d4a8' : '#666',
            color: '#0a0d12',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: data?.patients.length ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (data?.patients.length) {
              e.currentTarget.style.opacity = '0.8';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: '#141921',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>Loading patients...</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0a0d12', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Name</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Age</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Condition</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Days Since Visit</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Churn Score</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Risk</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Segment</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>WhatsApp</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient, index) => (
                    <tr
                      key={patient.patient_id}
                      onClick={() => onPatientClick(patient)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: index % 2 === 0 ? '#141921' : '#0f1318',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#1a1f2a';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#141921' : '#0f1318';
                      }}
                    >
                      <td style={{ padding: '16px', color: '#fff', fontSize: '14px' }}>{patient.full_name || 'N/A'}</td>
                      <td style={{ padding: '16px', color: '#9ca3af', fontSize: '14px' }}>{patient.age || 'N/A'}</td>
                      <td style={{ padding: '16px', color: '#9ca3af', fontSize: '14px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {patient.primary_condition || 'N/A'}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: getDaysVisitIndicator(patient.days_since_last_visit).color,
                            }}
                          />
                          <span style={{ color: '#9ca3af', fontSize: '14px' }}>
                            {patient.days_since_last_visit ? `${patient.days_since_last_visit} days` : 'No data'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              flex: 1,
                              height: '8px',
                              backgroundColor: '#1a1f2a',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              minWidth: '60px',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${patient.churn_risk_score || 0}%`,
                                backgroundColor: getChurnBarColor(patient.churn_risk_score),
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '12px', color: '#9ca3af', minWidth: '30px' }}>
                            {patient.churn_risk_score?.toFixed(0) || 0}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <RiskBadge label={patient.churn_risk_label} />
                      </td>
                      <td style={{ padding: '16px', color: '#9ca3af', fontSize: '14px' }}>{patient.patient_segment || 'N/A'}</td>
                      <td style={{ padding: '16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: patient.whatsapp_opt_in === 'Yes' ? '#00d4a8' : '#666',
                          }}
                        />
                      </td>
                      <td style={{ padding: '16px' }}>
                        <ActionButton
                          onClick={(e) => {
                            e?.stopPropagation();
                            onSendMessage(patient);
                          }}
                          variant="secondary"
                          disabled={patient.whatsapp_opt_in !== 'Yes'}
                        >
                          Send
                        </ActionButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div
              style={{
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: '#0a0d12',
              }}
            >
              <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                Showing {((data?.page || 1) - 1) * (data?.page_size || 50) + 1} to{' '}
                {Math.min((data?.page || 1) * (data?.page_size || 50), data?.total || 0)} of {data?.total || 0} patients
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handlePageChange((data?.page || 1) - 1)}
                  disabled={!data || data.page === 1}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: data && data.page > 1 ? '#141921' : '#0a0d12',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    color: data && data.page > 1 ? '#fff' : '#666',
                    cursor: data && data.page > 1 ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                  }}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange((data?.page || 1) + 1)}
                  disabled={!data || data.page >= data.total_pages}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: data && data.page < data.total_pages ? '#141921' : '#0a0d12',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    color: data && data.page < data.total_pages ? '#fff' : '#666',
                    cursor: data && data.page < data.total_pages ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PatientTable;
