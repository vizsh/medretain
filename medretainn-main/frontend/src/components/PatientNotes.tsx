import React, { useState, useEffect } from 'react';

interface PatientNote {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
  type: 'note' | 'call' | 'visit' | 'message' | 'alert';
}

interface PatientNotesProps {
  patientId: string;
}

const PatientNotes: React.FC<PatientNotesProps> = ({ patientId }) => {
  const [notes, setNotes] = useState<PatientNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'note' | 'call' | 'visit' | 'message' | 'alert'>('note');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [patientId]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      // In demo mode, generate sample notes
      const sampleNotes: PatientNote[] = [
        {
          id: '1',
          content: 'Patient called to schedule follow-up appointment for diabetes management. Requested morning slot.',
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          created_by: 'Dr. Sarah Chen',
          type: 'call'
        },
        {
          id: '2',
          content: 'Completed routine check-up. Blood pressure elevated (160/95). Adjusted medication dosage. Patient advised to monitor BP daily.',
          created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          created_by: 'Dr. Michael Rodriguez',
          type: 'visit'
        },
        {
          id: '3',
          content: 'High risk alert: Patient missed last 2 scheduled appointments. WhatsApp message sent with rescheduling options.',
          created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          created_by: 'System Alert',
          type: 'alert'
        },
        {
          id: '4',
          content: 'Patient reported feeling dizzy after starting new medication. Advised to take with food and continue monitoring.',
          created_at: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
          created_by: 'Nurse Jennifer Wilson',
          type: 'note'
        }
      ];
      setNotes(sampleNotes);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    const note: PatientNote = {
      id: Date.now().toString(),
      content: newNote.trim(),
      created_at: new Date().toISOString(),
      created_by: 'Current User',
      type: noteType
    };

    setNotes([note, ...notes]);
    setNewNote('');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return '📞';
      case 'visit': return '🏥';
      case 'message': return '💬';
      case 'alert': return '🚨';
      default: return '📝';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'call': return '#4cc9f0';
      case 'visit': return '#00d4a8';
      case 'message': return '#ffd166';
      case 'alert': return '#ff6b6b';
      default: return '#9ca3af';
    }
  };

  return (
    <div style={{
      backgroundColor: '#141921',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: 'rgba(0, 0, 0, 0.2)'
      }}>
        <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: '18px', fontWeight: 600 }}>
          📋 Patient Notes & Activity
        </h3>

        {/* Add New Note */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value as any)}
              style={{
                padding: '6px 10px',
                backgroundColor: '#0a0d12',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px'
              }}
            >
              <option value="note">📝 Note</option>
              <option value="call">📞 Call</option>
              <option value="visit">🏥 Visit</option>
              <option value="message">💬 Message</option>
              <option value="alert">🚨 Alert</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note about patient interaction..."
              style={{
                flex: 1,
                padding: '10px 12px',
                backgroundColor: '#0a0d12',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '14px',
                minHeight: '60px',
                resize: 'vertical',
                outline: 'none'
              }}
            />
            <button
              onClick={addNote}
              disabled={!newNote.trim()}
              style={{
                padding: '10px 16px',
                backgroundColor: newNote.trim() ? '#00d4a8' : '#333',
                color: newNote.trim() ? '#0a0d12' : '#666',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: newNote.trim() ? 'pointer' : 'not-allowed',
                whiteSpace: 'nowrap'
              }}
            >
              Add Note
            </button>
          </div>
        </div>
      </div>

      {/* Notes Timeline */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
            Loading notes...
          </div>
        ) : notes.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📝</div>
            <div>No notes recorded yet</div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>Add the first note above</div>
          </div>
        ) : (
          <div style={{ padding: '0' }}>
            {notes.map((note, index) => (
              <div
                key={note.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: index < notes.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                  position: 'relative'
                }}
              >
                {/* Timeline dot */}
                <div style={{
                  position: 'absolute',
                  left: '8px',
                  top: '20px',
                  width: '8px',
                  height: '8px',
                  backgroundColor: getTypeColor(note.type),
                  borderRadius: '50%',
                  border: '2px solid #141921'
                }} />

                {/* Timeline line */}
                {index < notes.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    left: '11px',
                    top: '32px',
                    width: '2px',
                    height: 'calc(100% - 16px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }} />
                )}

                <div style={{ marginLeft: '24px' }}>
                  {/* Note Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{getTypeIcon(note.type)}</span>
                    <span style={{
                      color: getTypeColor(note.type),
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {note.type}
                    </span>
                    <span style={{ color: '#6b7280', fontSize: '12px' }}>
                      {new Date(note.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span style={{ color: '#6b7280', fontSize: '12px' }}>
                      by {note.created_by}
                    </span>
                  </div>

                  {/* Note Content */}
                  <div style={{
                    color: '#e5e7eb',
                    fontSize: '14px',
                    lineHeight: 1.5,
                    padding: '8px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '6px',
                    borderLeft: `3px solid ${getTypeColor(note.type)}`
                  }}>
                    {note.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientNotes;