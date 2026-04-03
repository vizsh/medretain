/**
 * SendWhatsAppButton Component
 * Integrated with MedRetain CRM Production API
 * Sends WhatsApp messages via Twilio
 */

import React, { useState } from 'react';
import { sendMessage } from '../api';
import { Send, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface SendWhatsAppButtonProps {
  patientId: string;
  patientName?: string;
  messageType?: 'reminder' | 'reengagement' | 'followup';
  customText?: string;
  onSuccess?: (sid: string) => void;
  onError?: (error: string) => void;
  variant?: 'primary' | 'secondary' | 'success';
}

const SendWhatsAppButton: React.FC<SendWhatsAppButtonProps> = ({
  patientId,
  patientName = 'Patient',
  messageType = 'reminder',
  customText,
  onSuccess,
  onError,
  variant = 'primary'
}) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSendMessage = async () => {
    setLoading(true);
    setStatus('loading');
    setErrorMsg(null);

    try {
      const data = await sendMessage({
        patient_id: patientId,
        message_type: messageType,
        custom_text: customText
      });

      if (data.success) {
        setStatus('success');
        if (onSuccess) onSuccess(data.sid);
        setTimeout(() => setStatus('idle'), 4000);
      } else {
        throw new Error(data.error || 'Failed to send');
      }
    } catch (err: any) {
      const msg = err.message || 'Unknown error';
      setStatus('error');
      setErrorMsg(msg);
      if (onError) onError(msg);
      setTimeout(() => setStatus('idle'), 6000);
    } finally {
      setLoading(false);
    }
  };

  const getButtonStyles = () => {
    const base = "font-bold text-sm px-5 py-3 rounded-2xl flex items-center gap-2 transition-all active:scale-[0.98]";

    if (status === 'success') return `${base} bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-emerald-500/20`;
    if (status === 'error') return `${base} bg-red-500/10 text-red-400 border border-red-500/20`;

    if (variant === 'secondary') return `${base} bg-slate-800 text-slate-300 border border-white/5 hover:bg-slate-700`;
    if (variant === 'success') return `${base} bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/20`;

    return `${base} bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20`;
  };

  const getIcon = () => {
    if (loading) return <Loader2 size={18} className="animate-spin" />;
    if (status === 'success') return <CheckCircle2 size={18} />;
    if (status === 'error') return <XCircle size={18} />;
    return <Send size={18} />;
  };

  const getLabel = () => {
    if (loading) return "Sending...";
    if (status === 'success') return "Sent!";
    if (status === 'error') return "Failed";
    return messageType === 'reminder' ? "Send Reminder" : "Message Patient";
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleSendMessage}
        disabled={loading || status === 'success'}
        className={`${getButtonStyles()} disabled:opacity-50 disabled:cursor-not-allowed`}
        title={`Send WhatsApp message to ${patientName}`}
      >
        {getIcon()}
        {getLabel()}
      </button>

      {status === 'error' && errorMsg && (
        <div className="absolute top-full mt-2 left-0 w-64 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs shadow-2xl z-50 animate-in fade-in zoom-in-95">
          <b>Error:</b> {errorMsg}
        </div>
      )}
    </div>
  );
};

export default SendWhatsAppButton;
