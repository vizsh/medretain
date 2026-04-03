import React, { useEffect, useState } from 'react';
import {
  getBatches,
  createBatch,
  getBatchPatients,
  markBatchPatientActioned,
  getFilterOptions,
  sendMessage,
  Batch,
  BatchPatient,
  FilterOptions,
} from '../api';
import ActionButton from '../components/ActionButton';
import RiskBadge from '../components/RiskBadge';
import BatchWhatsAppCampaign from '../components/BatchWhatsAppCampaign';

const Batches: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBatch, setExpandedBatch] = useState<number | null>(null);
  const [batchPatients, setBatchPatients] = useState<Record<number, BatchPatient[]>>({});
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [sendingMessage, setSendingMessage] = useState<string | null>(null);

  // Form state - enhanced filters
  const [riskLevel, setRiskLevel] = useState('');
  const [segment, setSegment] = useState('');
  const [branch, setBranch] = useState('');
  const [isChronic, setIsChronic] = useState('');
  const [daysOverdue, setDaysOverdue] = useState('');
  const [satisfactionLevel, setSatisfactionLevel] = useState('');
  const [noShowRisk, setNoShowRisk] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [condition, setCondition] = useState('');
  const [whatsappOnly, setWhatsappOnly] = useState(false);
  const [batchSize, setBatchSize] = useState(25);
  const [label, setLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showBatchCampaign, setShowBatchCampaign] = useState(false);
  const [selectedBatchPatients, setSelectedBatchPatients] = useState<Array<{
    patientId: string;
    phone: string;
    name: string;
  }>>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load data with individual error handling
      let batchesData: Batch[] = [];
      let options: FilterOptions | null = null;

      try {
        batchesData = await getBatches();
      } catch (err) {
        console.error('Failed to load batches:', err);
        // getBatches already has fallback data in its catch block
        batchesData = await getBatches(); // This will return demo data
      }

      try {
        options = await getFilterOptions();
      } catch (err) {
        console.error('Failed to load filter options:', err);
        // getFilterOptions already has fallback data in its catch block
        options = await getFilterOptions(); // This will return demo data
      }

      setBatches(batchesData);
      setFilterOptions(options);
    } catch (err) {
      console.error('Critical error in loadData:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');

      // Set fallback data to prevent blank screen
      setBatches([]);
      setFilterOptions({
        risk_levels: ['High', 'Medium', 'Low'],
        branches: ['Downtown Hospital', 'Westside Clinic', 'Eastside Medical'],
        segments: ['Chronic High Value', 'Chronic Regular', 'Returning', 'One-time', 'Acute High Risk'],
        conditions: ['Diabetes', 'Hypertension', 'Heart Disease'],
        chronic_options: ['Yes', 'No'],
        days_overdue_options: [
          { value: '0-30', label: '0-30 days' },
          { value: '31-90', label: '31-90 days' },
          { value: '90+', label: '90+ days' }
        ],
        satisfaction_levels: [
          { value: '1', label: '1 star' },
          { value: '2', label: '2 stars' },
          { value: '3', label: '3 stars' },
          { value: '4', label: '4 stars' },
          { value: '5', label: '5 stars' }
        ],
        no_show_risk_levels: [
          { value: 'low', label: 'Low (0-10%)' },
          { value: 'medium', label: 'Medium (10-25%)' },
          { value: 'high', label: 'High (25%+)' }
        ],
        age_groups: [
          { value: 'young', label: 'Young (0-35)' },
          { value: 'middle', label: 'Middle (36-55)' },
          { value: 'senior', label: 'Senior (56-70)' },
          { value: 'elderly', label: 'Elderly (70+)' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async () => {
    if (!label.trim()) {
      alert('Please enter a batch label');
      return;
    }

    try {
      setCreating(true);
      await createBatch({
        filter_criteria: {
          risk_level: riskLevel || undefined,
          segment: segment || undefined,
          branch: branch || undefined,
          is_chronic: isChronic || undefined,
          days_overdue: daysOverdue || undefined,
          satisfaction_level: satisfactionLevel || undefined,
          no_show_risk: noShowRisk || undefined,
          age_group: ageGroup || undefined,
          condition: condition || undefined,
          whatsapp_only: whatsappOnly || undefined,
          limit: batchSize,
        },
        label: label.trim(),
      });
      resetForm();
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create batch');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setRiskLevel('');
    setSegment('');
    setBranch('');
    setIsChronic('');
    setDaysOverdue('');
    setSatisfactionLevel('');
    setNoShowRisk('');
    setAgeGroup('');
    setCondition('');
    setWhatsappOnly(false);
    setBatchSize(25);
    setLabel('');
  };

  const handleExpandBatch = async (batchId: number) => {
    if (expandedBatch === batchId) {
      setExpandedBatch(null);
      return;
    }
    setExpandedBatch(batchId);
    if (!batchPatients[batchId]) {
      try {
        const patients = await getBatchPatients(batchId);
        setBatchPatients((prev) => ({ ...prev, [batchId]: patients }));
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to load batch patients');
      }
    }
  };

  const handleMarkActioned = async (batchId: number, patientId: string) => {
    try {
      await markBatchPatientActioned(batchId, patientId);
      setBatchPatients((prev) => ({
        ...prev,
        [batchId]: prev[batchId].map((p) =>
          p.patient_id === patientId ? { ...p, actioned: true } : p
        ),
      }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to mark as actioned');
    }
  };

  const handleSendMessage = async (patientId: string) => {
    try {
      setSendingMessage(patientId);
      await sendMessage({ patient_id: patientId, message_type: 'reengagement' });
      alert('Message sent successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSendingMessage(null);
    }
  };

  // Safe JSON parsing helper
  const parseFilterCriteria = (filterCriteria: string): any => {
    if (!filterCriteria) return {};

    try {
      // Try to parse as JSON first
      return JSON.parse(filterCriteria);
    } catch {
      // If it fails, it's probably a plain string (legacy format)
      // Return a basic object with the string as a label
      return { legacy_label: filterCriteria };
    }
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (riskLevel) count++;
    if (segment) count++;
    if (branch) count++;
    if (isChronic) count++;
    if (daysOverdue) count++;
    if (satisfactionLevel) count++;
    if (noShowRisk) count++;
    if (ageGroup) count++;
    if (condition) count++;
    if (whatsappOnly) count++;
    return count;
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    backgroundColor: '#0a0d12',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    color: '#9ca3af',
    marginBottom: '6px',
    fontWeight: 500,
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: '32px', fontWeight: 700, color: '#fff' }}>
            Patient Batches
          </h1>
          <p style={{ margin: 0, fontSize: '16px', color: '#9ca3af' }}>
            Create targeted outreach campaigns with smart patient segmentation
          </p>
        </div>
        <div style={{
          padding: '12px 20px',
          backgroundColor: 'rgba(0, 212, 168, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(0, 212, 168, 0.2)'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#00d4a8' }}>{batches.length}</div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Active Batches</div>
        </div>
      </div>

      {/* Create Batch Card */}
      <div style={{
        backgroundColor: '#141921',
        padding: '28px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        marginBottom: '32px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 600, color: '#fff' }}>
              Create New Batch
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
              Select criteria to segment patients for outreach
            </p>
          </div>
          {getActiveFilterCount() > 0 && (
            <div style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(76, 201, 240, 0.1)',
              borderRadius: '20px',
              border: '1px solid rgba(76, 201, 240, 0.3)',
              color: '#4cc9f0',
              fontSize: '13px',
              fontWeight: 500
            }}>
              {getActiveFilterCount()} filter{getActiveFilterCount() > 1 ? 's' : ''} active
            </div>
          )}
        </div>

        {/* Primary Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Churn Risk Level</label>
            <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} style={selectStyle}>
              <option value="">Any Risk Level</option>
              {filterOptions?.risk_levels?.map(level => (
                <option key={level} value={level}>{level} Risk</option>
              )) || []}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Patient Segment</label>
            <select value={segment} onChange={(e) => setSegment(e.target.value)} style={selectStyle}>
              <option value="">Any Segment</option>
              {filterOptions?.segments?.map(seg => (
                <option key={seg} value={seg}>{seg}</option>
              )) || []}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Hospital Branch</label>
            <select value={branch} onChange={(e) => setBranch(e.target.value)} style={selectStyle}>
              <option value="">Any Branch</option>
              {filterOptions?.branches?.map(b => (
                <option key={b} value={b}>{b}</option>
              )) || []}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Days Overdue</label>
            <select value={daysOverdue} onChange={(e) => setDaysOverdue(e.target.value)} style={selectStyle}>
              <option value="">Any Duration</option>
              {filterOptions?.days_overdue_options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              )) || []}
            </select>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            background: 'none',
            border: 'none',
            color: '#4cc9f0',
            fontSize: '14px',
            cursor: 'pointer',
            padding: '8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '16px'
          }}
        >
          {showAdvanced ? '▼' : '▶'} Advanced Filters
        </button>

        {showAdvanced && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '16px',
            padding: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '12px'
          }}>
            <div>
              <label style={labelStyle}>Chronic Condition</label>
              <select value={isChronic} onChange={(e) => setIsChronic(e.target.value)} style={selectStyle}>
                <option value="">Any</option>
                <option value="Yes">Chronic Patients</option>
                <option value="No">Non-Chronic</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Satisfaction Level</label>
              <select value={satisfactionLevel} onChange={(e) => setSatisfactionLevel(e.target.value)} style={selectStyle}>
                <option value="">Any Satisfaction</option>
                {filterOptions?.satisfaction_levels?.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                )) || []}
              </select>
            </div>

            <div>
              <label style={labelStyle}>No-Show Risk</label>
              <select value={noShowRisk} onChange={(e) => setNoShowRisk(e.target.value)} style={selectStyle}>
                <option value="">Any No-Show Rate</option>
                {filterOptions?.no_show_risk_levels?.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                )) || []}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Age Group</label>
              <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} style={selectStyle}>
                <option value="">Any Age</option>
                {filterOptions?.age_groups?.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                )) || []}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Primary Condition</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value)} style={selectStyle}>
                <option value="">Any Condition</option>
                {filterOptions?.conditions?.map(c => (
                  <option key={c} value={c}>{c}</option>
                )) || []}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px 0' }}>
                <input
                  type="checkbox"
                  checked={whatsappOnly}
                  onChange={(e) => setWhatsappOnly(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#00d4a8' }}
                />
                <span style={{ color: '#fff', fontSize: '14px' }}>WhatsApp Only</span>
              </label>
            </div>
          </div>
        )}

        {/* Batch Settings */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          gap: '16px',
          padding: '20px',
          backgroundColor: 'rgba(0, 212, 168, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(0, 212, 168, 0.1)'
        }}>
          <div>
            <label style={labelStyle}>Batch Label *</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., High Risk Diabetes Patients - March 2026"
              style={{
                ...selectStyle,
                border: label.trim() ? '1px solid rgba(0, 212, 168, 0.3)' : '1px solid rgba(255, 255, 255, 0.12)',
              }}
            />
          </div>

          <div>
            <label style={labelStyle}>Batch Size</label>
            <select value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))} style={selectStyle}>
              <option value={10}>10 patients</option>
              <option value={25}>25 patients</option>
              <option value={50}>50 patients</option>
              <option value={100}>100 patients</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
            <ActionButton onClick={handleCreateBatch} loading={creating} style={{ flex: 1 }}>
              {creating ? 'Creating...' : 'Create Batch'}
            </ActionButton>
            <button
              onClick={resetForm}
              style={{
                padding: '12px 20px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#9ca3af',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Batches List */}
      <div>
        <h2 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: 600, color: '#fff' }}>
          Campaign Batches
        </h2>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '3px solid rgba(255,255,255,0.1)',
              borderTopColor: '#4cc9f0',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <div style={{ color: '#9ca3af' }}>Loading batches...</div>
          </div>
        ) : error ? (
          <div style={{
            backgroundColor: '#141921',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            color: '#ff6b6b',
          }}>
            Error: {error}
          </div>
        ) : batches.length === 0 ? (
          <div style={{
            backgroundColor: '#141921',
            padding: '60px 24px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.5 }}>📦</div>
            <h3 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: 600, color: '#fff' }}>
              No batches created yet
            </h3>
            <p style={{ margin: 0, fontSize: '15px', color: '#9ca3af', maxWidth: '400px', marginInline: 'auto' }}>
              Create your first patient batch using the filters above to start your outreach campaign
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {batches.map((batch) => {
              const patients = batchPatients[batch.id] || [];
              const actionedCount = patients.filter((p) => p.actioned).length;
              const totalCount = batch.patient_count || batch.batch_size;
              const progressPercent = totalCount > 0 ? (actionedCount / totalCount) * 100 : 0;
              const filters = parseFilterCriteria(batch.filter_criteria || '');

              return (
                <div key={batch.id} style={{
                  backgroundColor: '#141921',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden'
                }}>
                  <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600, color: '#fff' }}>
                          {batch.label}
                        </h3>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#9ca3af' }}>
                          <span>{new Date(batch.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span>•</span>
                          <span>{totalCount} patients</span>
                          {(filters.risk_level || filters.legacy_label) && (
                            <>
                              <span>•</span>
                              <span style={{
                                color: filters.risk_level === 'High' || filters.legacy_label?.includes('High') ? '#ff6b6b' :
                                       filters.risk_level === 'Medium' || filters.legacy_label?.includes('Medium') ? '#ffd166' : '#00d4a8'
                              }}>
                                {filters.risk_level ? `${filters.risk_level} Risk` : filters.legacy_label}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <ActionButton onClick={() => handleExpandBatch(batch.id)} variant="secondary">
                        {expandedBatch === batch.id ? 'Collapse' : 'View Patients'}
                      </ActionButton>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                        <span style={{ color: '#9ca3af' }}>Campaign Progress</span>
                        <span style={{ color: progressPercent === 100 ? '#00d4a8' : '#fff', fontWeight: 500 }}>
                          {actionedCount} / {totalCount} contacted ({progressPercent.toFixed(0)}%)
                        </span>
                      </div>
                      <div style={{ height: '6px', backgroundColor: '#0a0d12', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${progressPercent}%`,
                          background: progressPercent === 100 ? '#00d4a8' : 'linear-gradient(90deg, #4cc9f0, #00d4a8)',
                          transition: 'width 0.3s ease',
                        }} />
                      </div>
                    </div>
                  </div>

                  {expandedBatch === batch.id && (
                    <div style={{
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      padding: '20px'
                    }}>
                      {/* Batch Campaign Button */}
                      {patients.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                          <button
                            onClick={() => {
                              const patientsForCampaign = patients
                                .filter(p => p.contact_number)
                                .map(p => ({
                                  patientId: p.patient_id,
                                  phone: p.contact_number || '',
                                  name: p.full_name || 'Unknown'
                                }));
                              setSelectedBatchPatients(patientsForCampaign);
                              setShowBatchCampaign(true);
                            }}
                            style={{
                              padding: '12px 20px',
                              backgroundColor: '#00d4a8',
                              color: '#0a0d12',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            📱 Send WhatsApp Campaign ({patients.filter(p => p.contact_number).length} patients)
                          </button>
                        </div>
                      )}

                      {patients.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#9ca3af' }}>Loading patients...</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {patients.map((patient) => (
                            <div key={patient.patient_id} style={{
                              padding: '16px 20px',
                              backgroundColor: '#141921',
                              borderRadius: '10px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              border: patient.actioned ? '1px solid rgba(0, 212, 168, 0.2)' : '1px solid transparent',
                            }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>
                                    {patient.full_name || 'Unknown'}
                                  </span>
                                  <RiskBadge label={patient.churn_risk_label} />
                                  <span style={{
                                    fontSize: '12px',
                                    color: '#6b7280',
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    padding: '2px 8px',
                                    borderRadius: '4px'
                                  }}>
                                    Score: {patient.churn_risk_score?.toFixed(0) || 0}
                                  </span>
                                </div>
                                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                  ID: {patient.patient_id} • {patient.contact_number || 'No phone'}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                {!patient.actioned && (
                                  <ActionButton
                                    onClick={() => handleSendMessage(patient.patient_id)}
                                    loading={sendingMessage === patient.patient_id}
                                    variant="secondary"
                                  >
                                    {sendingMessage === patient.patient_id ? 'Sending...' : 'Send Message'}
                                  </ActionButton>
                                )}
                                {patient.actioned ? (
                                  <span style={{
                                    padding: '10px 20px',
                                    backgroundColor: 'rgba(0, 212, 168, 0.15)',
                                    color: '#00d4a8',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                  }}>
                                    ✓ Contacted
                                  </span>
                                ) : (
                                  <ActionButton onClick={() => handleMarkActioned(batch.id, patient.patient_id)}>
                                    Mark Done
                                  </ActionButton>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Batch WhatsApp Campaign Modal */}
      <BatchWhatsAppCampaign
        isOpen={showBatchCampaign}
        onClose={() => {
          setShowBatchCampaign(false);
          setSelectedBatchPatients([]);
        }}
        patients={selectedBatchPatients}
      />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Batches;
