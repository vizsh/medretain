/**
 * Batch WhatsApp Campaign Component
 * Send messages to multiple patients at once using production API
 */

import React, { useState } from 'react';
import { sendBatchMessages } from '../api';

interface BatchResult {
  patient_id: string;
  success: boolean;
  sid?: string;
  error?: string;
}

interface BatchCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients?: Array<{
    patientId: string;
    name: string;
  }>;
}

const BatchWhatsAppCampaign: React.FC<BatchCampaignModalProps> = ({
  isOpen,
  onClose,
  patients = []
}) => {
  const [messageType, setMessageType] = useState('reminder');
  const [customText, setCustomText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [campaignStarted, setCampaignStarted] = useState(false);

  const handleSendBatch = async () => {
    if (!patients || patients.length === 0) return;

    setLoading(true);
    setCampaignStarted(true);

    try {
      const payload = {
        patient_ids: patients.map(p => p.patientId),
        message_type: messageType,
        custom_text: customText || undefined
      };

      const data = await sendBatchMessages(payload);
      setResults(data.results);

    } catch (error: any) {
      alert(`Batch Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const successCount = results.filter(r => r.success).length;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[2000] p-4">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg p-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Batch Outreach</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">×</button>
        </div>

        {!campaignStarted ? (
          <div className="space-y-6">
            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Message Type</label>
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white"
              >
                <option value="reminder">Appointment Reminder</option>
                <option value="reengagement">Re-engagement</option>
                <option value="followup">Post-visit Follow-up</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Custom Text (Optional)</label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Leave blank to use smart templates..."
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white h-32 resize-none"
              />
            </div>

            <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl">
              <p className="text-blue-400 text-sm font-medium">
                You are about to send messages to {patients.length} patients. This will use your real Twilio balance.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-4 px-6 bg-slate-800 text-slate-300 font-bold rounded-2xl hover:bg-slate-700 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSendBatch}
                className="flex-1 py-4 px-6 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
                disabled={loading}
              >
                {loading ? 'Sending...' : '🚀 Start Campaign'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <p className="text-emerald-400 font-bold text-center">
                {loading ? 'Campaign in progress...' : `Campaign Completed: ${successCount}/${patients.length} successful`}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 mb-6">
              {results.map((r, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-slate-300 text-sm">{r.patient_id}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${r.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {r.success ? 'SENT' : 'FAILED'}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl"
              disabled={loading}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchWhatsAppCampaign;
