import React, { useState } from 'react';
import PatientTable from '../components/PatientTable';
import PatientDrawer from '../components/PatientDrawer';
import ExportModal from '../components/ExportModal';
import { Patient, exportPatientData } from '../api';

const Patients: React.FC = () => {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_messagePatient, setMessagePatient] = useState<Patient | null>(null);

  const handleExport = async (format: 'csv' | 'pdf', filters: any) => {
    try {
      await exportPatientData(format, filters);
      alert(`Patient data exported successfully as ${format.toUpperCase()}!`);
    } catch (error) {
      alert('Export failed. Please try again.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: '32px', fontWeight: 700, color: '#fff' }}>
            Patients
          </h1>
          <p style={{ margin: '0', fontSize: '16px', color: '#9ca3af' }}>
            Manage all patients and their retention risk profiles
          </p>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          style={{
            padding: '12px 20px',
            backgroundColor: '#4cc9f0',
            color: '#0a0d12',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          📊 Export Data
        </button>
      </div>

      <PatientTable
        onPatientClick={(patient) => setSelectedPatientId(patient.patient_id)}
        onSendMessage={(patient) => setMessagePatient(patient)}
      />

      <PatientDrawer
        patientId={selectedPatientId}
        onClose={() => setSelectedPatientId(null)}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        totalPatients={2200}
      />
    </div>
  );
};

export default Patients;
