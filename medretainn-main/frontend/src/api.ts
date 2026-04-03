/**
 * MedRetain CRM - Production API Client
 * Cleaned of all mock data and demo logic.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Types
export interface Patient {
  patient_id: string;
  full_name: string | null;
  age: number | null;
  gender: string | null;
  contact_number: string | null;
  email: string | null;
  primary_condition: string | null;
  is_chronic: string | null;
  churn_risk_score: number | null;
  churn_risk_label: string | null;
  days_since_last_visit: number | null;
  whatsapp_opt_in: string | null;
  crm_action_required: string | null;
  patient_segment: string | null;
  hospital_branch: string | null;
  satisfaction_score: number | null;
  no_show_rate: number | null;
}

export interface PatientDetail extends Patient {
  primary_doctor_name: string | null;
  last_visit_date: string | null;
  total_appointments: number | null;
  completed_visits: number | null;
}

export interface PatientsResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  patients: Patient[];
}

export interface PatientFilters {
  page?: number;
  page_size?: number;
  churn_risk_label?: string;
  is_chronic?: string;
  hospital_branch?: string;
}

export interface AnalyticsSummary {
  total_patients: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  avg_churn_score: number;
}

export interface Batch {
  id: number;
  created_at: string;
  batch_size: number;
  label: string;
  patient_count?: number;
}

// REST Client Helper
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401) {
        // Signal HIMS Auth session expired
        throw new Error('HIMS_AUTH_EXPIRED');
      }
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.detail || `API Error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out - Backend is not responding.');
    }
    throw error;
  }
}

// Production API functions
export async function getPatients(filters: PatientFilters = {}): Promise<PatientsResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  return await fetchAPI<PatientsResponse>(`/patients${params.toString() ? `?${params.toString()}` : ''}`);
}

export async function getPatient(id: string): Promise<PatientDetail> {
  return await fetchAPI<PatientDetail>(`/patients/${id}`);
}

export async function getSummary(): Promise<AnalyticsSummary> {
  return await fetchAPI<AnalyticsSummary>('/analytics/summary');
}

export async function getBatches(): Promise<Batch[]> {
  return await fetchAPI<Batch[]>('/batches');
}

export async function sendMessage(payload: { patient_id: string; message_type: string, custom_text?: string }): Promise<any> {
  return await fetchAPI('/messages/send', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function sendBatchMessages(payload: { patient_ids: string[]; message_type: string, custom_text?: string }): Promise<any> {
  return await fetchAPI('/messages/send-batch', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// HIMS Connection endpoints
export async function checkHIMSConnection(): Promise<any> {
  return await fetchAPI('/hims/connection-status');
}

export async function connectHIMS(payload: { hospital_id: string; hims_name: string; credentials: any }): Promise<any> {
  return await fetchAPI('/hims/connect', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function disconnectHIMS(hospital_id: string): Promise<any> {
  return await fetchAPI(`/hims/disconnect/${hospital_id}`, { method: 'DELETE' });
}
