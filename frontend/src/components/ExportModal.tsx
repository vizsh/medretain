import React, { useState } from 'react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'csv' | 'pdf', filters: any) => void;
  totalPatients: number;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, totalPatients }) => {
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv');
  const [includeRiskAnalysis, setIncludeRiskAnalysis] = useState(true);
  const [includeContactInfo, setIncludeContactInfo] = useState(true);
  const [riskLevelFilter, setRiskLevelFilter] = useState('');

  if (!isOpen) return null;

  const handleExport = () => {
    onExport(format, {
      includeRiskAnalysis,
      includeContactInfo,
      riskLevelFilter
    });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#141921',
        padding: '32px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        width: '500px',
        maxWidth: '90vw'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '22px', fontWeight: 600 }}>
            📊 Export Patient Data
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

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '14px' }}>
            Export Format
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#fff' }}>
              <input
                type="radio"
                value="csv"
                checked={format === 'csv'}
                onChange={(e) => setFormat(e.target.value as 'csv')}
                style={{ accentColor: '#00d4a8' }}
              />
              📄 CSV (Excel friendly)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#fff' }}>
              <input
                type="radio"
                value="pdf"
                checked={format === 'pdf'}
                onChange={(e) => setFormat(e.target.value as 'pdf')}
                style={{ accentColor: '#00d4a8' }}
              />
              📋 PDF Report
            </label>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '14px' }}>
            Risk Level Filter
          </label>
          <select
            value={riskLevelFilter}
            onChange={(e) => setRiskLevelFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#0a0d12',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: '#fff'
            }}
          >
            <option value="">All Risk Levels</option>
            <option value="High">High Risk Only</option>
            <option value="Medium">Medium Risk Only</option>
            <option value="Low">Low Risk Only</option>
          </select>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', color: '#9ca3af', marginBottom: '12px', fontSize: '14px' }}>
            Include Data Fields
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#fff' }}>
              <input
                type="checkbox"
                checked={includeRiskAnalysis}
                onChange={(e) => setIncludeRiskAnalysis(e.target.checked)}
                style={{ accentColor: '#00d4a8' }}
              />
              🎯 Risk Analysis & ML Insights
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#fff' }}>
              <input
                type="checkbox"
                checked={includeContactInfo}
                onChange={(e) => setIncludeContactInfo(e.target.checked)}
                style={{ accentColor: '#00d4a8' }}
              />
              📞 Contact Information
            </label>
          </div>
        </div>

        <div style={{
          padding: '16px',
          backgroundColor: 'rgba(0, 212, 168, 0.1)',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <div style={{ color: '#00d4a8', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
            Export Summary
          </div>
          <div style={{ color: '#9ca3af', fontSize: '13px' }}>
            {totalPatients} patients • {format.toUpperCase()} format
            {riskLevelFilter && ` • ${riskLevelFilter} risk only`}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#9ca3af',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#00d4a8',
              border: 'none',
              borderRadius: '8px',
              color: '#0a0d12',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            📥 Export Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;