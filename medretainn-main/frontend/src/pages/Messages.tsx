import React, { useEffect, useState } from 'react';
import { getMessageLog } from '../api';

interface MessageLogEntry {
  id: number;
  patient_id: string;
  patient_name: string;
  message_type: string;
  content: string;
  sent_at: string;
  delivery_status: string;
  twilio_sid: string | null;
  error_message: string | null;
}

const Messages: React.FC = () => {
  const [messages, setMessages] = useState<MessageLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await getMessageLog();
      setMessages(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'sent':
        return '#00d4a8';
      case 'failed':
      case 'undelivered':
      case 'error':
        return '#ff6b6b';
      case 'queued':
      case 'sending':
        return '#ffd166';
      default:
        return '#9ca3af';
    }
  };

  const truncateContent = (content: string, maxLength: number = 80) => {
    if (!content) return 'N/A';
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div>
      <h1 style={{ margin: '0 0 8px', fontSize: '32px', fontWeight: 700, color: '#fff' }}>
        Messages Log
      </h1>
      <p style={{ margin: '0 0 32px', fontSize: '16px', color: '#9ca3af' }}>
        WhatsApp message history and delivery status
      </p>

      {/* Twilio Sandbox Notice */}
      {showBanner && (
        <div
          style={{
            backgroundColor: '#141921',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid rgba(76, 201, 240, 0.3)',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px' }}>ℹ️</span>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#4cc9f0' }}>
                Twilio Sandbox Mode
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af', lineHeight: 1.6 }}>
              Using Twilio WhatsApp sandbox. Patients must first send{' '}
              <strong style={{ color: '#fff' }}>"join [your-word]"</strong> to{' '}
              <strong style={{ color: '#fff' }}>+1 415 523 8886</strong> to receive messages.
              Check your Twilio console for your sandbox keyword.
            </p>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '0 0 0 16px',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Messages Table */}
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
            <div style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>Loading messages...</div>
          </div>
        ) : error ? (
          <div style={{ padding: '24px' }}>
            <div style={{ color: '#ff6b6b', marginBottom: '16px' }}>Error: {error}</div>
            <button
              onClick={loadMessages}
              style={{
                padding: '10px 20px',
                backgroundColor: '#00d4a8',
                border: 'none',
                borderRadius: '6px',
                color: '#0a0d12',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600, color: '#fff' }}>
              No messages sent yet
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af' }}>
              WhatsApp messages sent to patients will appear here
            </p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0a0d12', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <th
                      style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        color: '#9ca3af',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}
                    >
                      Patient Name
                    </th>
                    <th
                      style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        color: '#9ca3af',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}
                    >
                      Message Type
                    </th>
                    <th
                      style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        color: '#9ca3af',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}
                    >
                      Sent At
                    </th>
                    <th
                      style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        color: '#9ca3af',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}
                    >
                      Status
                    </th>
                    <th
                      style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        color: '#9ca3af',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}
                    >
                      Message Content
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((message, index) => (
                    <tr
                      key={message.id}
                      style={{
                        backgroundColor: index % 2 === 0 ? '#141921' : '#0f1318',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      }}
                    >
                      <td style={{ padding: '16px', color: '#fff', fontSize: '14px' }}>
                        {message.patient_name || 'N/A'}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            backgroundColor: 'rgba(76, 201, 240, 0.2)',
                            color: '#4cc9f0',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                          }}
                        >
                          {message.message_type}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: '#9ca3af', fontSize: '14px' }}>
                        {formatDate(message.sent_at)}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            backgroundColor: `${getStatusColor(message.delivery_status)}20`,
                            color: getStatusColor(message.delivery_status),
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: getStatusColor(message.delivery_status),
                            }}
                          />
                          {message.delivery_status}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '16px',
                          color: '#9ca3af',
                          fontSize: '14px',
                          maxWidth: '300px',
                        }}
                      >
                        {truncateContent(message.content)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
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
                Showing {messages.length} message{messages.length !== 1 ? 's' : ''}
              </div>
              <button
                onClick={loadMessages}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#141921',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Refresh
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Messages;
