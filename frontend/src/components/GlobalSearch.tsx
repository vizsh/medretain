import React, { useState, useEffect } from 'react';
import { getPatients, Patient } from '../api';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    includeNames: true,
    includeConditions: true,
    includePatientIds: true,
    riskLevel: '',
    branch: ''
  });

  useEffect(() => {
    if (searchQuery.length >= 2) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchFilters]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const response = await getPatients({
        page_size: 100,
        churn_risk_label: searchFilters.riskLevel || undefined,
        hospital_branch: searchFilters.branch || undefined
      });

      const filtered = response.patients.filter(patient => {
        const query = searchQuery.toLowerCase();
        return (
          (searchFilters.includeNames && patient.full_name?.toLowerCase().includes(query)) ||
          (searchFilters.includeConditions && patient.primary_condition?.toLowerCase().includes(query)) ||
          (searchFilters.includePatientIds && patient.patient_id.toLowerCase().includes(query))
        );
      });

      setSearchResults(filtered.slice(0, 20)); // Limit to 20 results
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '100px',
      zIndex: 2000
    }}>
      <div style={{
        backgroundColor: '#141921',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        width: '700px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        overflow: 'hidden'
      }}>
        {/* Search Header */}
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: 600 }}>
              🔍 Global Search
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                fontSize: '24px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Search patients, conditions, or IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '16px 20px',
                backgroundColor: '#0a0d12',
                border: '2px solid rgba(76, 201, 240, 0.3)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {loading && (
              <div style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#4cc9f0'
              }}>
                Searching...
              </div>
            )}
          </div>

          {/* Search Filters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af', fontSize: '14px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={searchFilters.includeNames}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, includeNames: e.target.checked }))}
                style={{ accentColor: '#4cc9f0' }}
              />
              👤 Names
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af', fontSize: '14px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={searchFilters.includeConditions}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, includeConditions: e.target.checked }))}
                style={{ accentColor: '#4cc9f0' }}
              />
              🏥 Conditions
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af', fontSize: '14px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={searchFilters.includePatientIds}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, includePatientIds: e.target.checked }))}
                style={{ accentColor: '#4cc9f0' }}
              />
              🆔 Patient IDs
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <select
              value={searchFilters.riskLevel}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, riskLevel: e.target.value }))}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: '#0a0d12',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px'
              }}
            >
              <option value="">All Risk Levels</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
            </select>
            <select
              value={searchFilters.branch}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, branch: e.target.value }))}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: '#0a0d12',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px'
              }}
            >
              <option value="">All Branches</option>
              <option value="Downtown Hospital">Downtown Hospital</option>
              <option value="Westside Clinic">Westside Clinic</option>
              <option value="Eastside Medical">Eastside Medical</option>
            </select>
          </div>
        </div>

        {/* Search Results */}
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {searchQuery.length < 2 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🔍</div>
              <div>Type at least 2 characters to search</div>
            </div>
          )}

          {searchQuery.length >= 2 && searchResults.length === 0 && !loading && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>😔</div>
              <div>No patients found matching your search</div>
            </div>
          )}

          {searchResults.map((patient) => (
            <div
              key={patient.patient_id}
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(76, 201, 240, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              onClick={() => {
                // In a real app, this would navigate to the patient details
                alert(`Navigate to ${patient.full_name} (${patient.patient_id})`);
                onClose();
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                <div>
                  <div style={{ color: '#fff', fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                    {patient.full_name || 'Unknown Name'}
                    <span style={{ color: '#9ca3af', fontSize: '14px', fontWeight: 400, marginLeft: '8px' }}>
                      ({patient.patient_id})
                    </span>
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                    {patient.primary_condition} • {patient.hospital_branch} • Age {patient.age}
                  </div>
                </div>
                <div style={{
                  padding: '4px 8px',
                  backgroundColor: patient.churn_risk_label === 'High' ? 'rgba(255, 107, 107, 0.2)' :
                                  patient.churn_risk_label === 'Medium' ? 'rgba(255, 209, 102, 0.2)' : 'rgba(0, 212, 168, 0.2)',
                  color: patient.churn_risk_label === 'High' ? '#ff6b6b' :
                         patient.churn_risk_label === 'Medium' ? '#ffd166' : '#00d4a8',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  {patient.churn_risk_label} Risk
                </div>
              </div>
            </div>
          ))}
        </div>

        {searchResults.length > 0 && (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            color: '#9ca3af',
            fontSize: '13px',
            textAlign: 'center'
          }}>
            Showing {searchResults.length} results • Press Enter to view first result
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalSearch;