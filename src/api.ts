import { ClinicSettings, Service, StaffMember, Review, Slot, Appointment, AdminUser, ContactInquiry } from './types.ts';

const API_BASE = '/api';

export async function fetchClinicSettings(): Promise<ClinicSettings> {
  const res = await fetch(`${API_BASE}/clinic`);
  if (!res.ok) throw new Error('Failed to load clinic information');
  return res.json();
}

export async function fetchServices(includeInactive = false): Promise<Service[]> {
  const url = `${API_BASE}/services${includeInactive ? '?include_inactive=true' : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load services');
  return res.json();
}

export async function fetchStaff(): Promise<StaffMember[]> {
  const res = await fetch(`${API_BASE}/staff`);
  if (!res.ok) throw new Error('Failed to load practitioners');
  return res.json();
}

export async function fetchReviews(): Promise<Review[]> {
  const res = await fetch(`${API_BASE}/reviews`);
  if (!res.ok) throw new Error('Failed to load patient reviews');
  return res.json();
}

export async function fetchAvailability(
  date: string,
  serviceId?: string,
  staffId?: string
): Promise<{ date: string; dayOfWeek: string; isClosed: boolean; reason?: string; slots: Slot[] }> {
  const params = new URLSearchParams({ date });
  if (serviceId) params.append('serviceId', serviceId);
  if (staffId) params.append('staffId', staffId);

  const res = await fetch(`${API_BASE}/availability?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch slot availability');
  }
  return res.json();
}

export async function bookAppointment(data: {
  serviceId: string;
  staffId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  appointmentDate: string;
  startTime: string;
  notes?: string;
}): Promise<{ message: string; appointment: Appointment; notifications: any }> {
  const res = await fetch(`${API_BASE}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to book appointment');
  }
  return json;
}

export async function lookupAppointment(reference: string, phone: string): Promise<Appointment> {
  const params = new URLSearchParams({ reference, phone });
  const res = await fetch(`${API_BASE}/appointments/lookup?${params.toString()}`);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Appointment lookup failed');
  }
  return json;
}

export async function cancelAppointment(
  reference: string,
  phone: string,
  reason?: string
): Promise<{ message: string; bookingReference: string }> {
  const res = await fetch(`${API_BASE}/appointments/${encodeURIComponent(reference)}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, reason }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to cancel appointment');
  }
  return json;
}

export async function rescheduleAppointment(
  reference: string,
  phone: string,
  newDate: string,
  newStartTime: string
): Promise<{ message: string; newDate: string; newStartTime: string; newEndTime: string }> {
  const res = await fetch(`${API_BASE}/appointments/${encodeURIComponent(reference)}/reschedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, newDate, newStartTime }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to reschedule appointment');
  }
  return json;
}

export async function submitContact(data: {
  name: string;
  phone: string;
  email?: string;
  subject?: string;
  message: string;
}): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to submit contact message');
  }
  return json;
}

// Admin API
function getAdminHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function adminLogin(username: string, password: string): Promise<{ token: string; admin: AdminUser }> {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Invalid credentials');
  return json;
}

export async function adminVerify(token: string): Promise<{ admin: AdminUser }> {
  const res = await fetch(`${API_BASE}/admin/verify`, {
    headers: getAdminHeaders(token),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Session invalid');
  return json;
}

export async function getAdminStats(token: string) {
  const res = await fetch(`${API_BASE}/admin/stats`, {
    headers: getAdminHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to fetch statistics');
  return res.json();
}

export async function getAdminAppointments(token: string, filters?: { date?: string; status?: string; search?: string }): Promise<Appointment[]> {
  const params = new URLSearchParams();
  if (filters?.date) params.append('date', filters.date);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);

  const res = await fetch(`${API_BASE}/admin/appointments?${params.toString()}`, {
    headers: getAdminHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to fetch appointments');
  return res.json();
}

export async function updateAppointmentStatus(
  token: string,
  id: number,
  status: string,
  notes?: string,
  cancellation_reason?: string
) {
  const res = await fetch(`${API_BASE}/admin/appointments/${id}`, {
    method: 'PATCH',
    headers: getAdminHeaders(token),
    body: JSON.stringify({ status, notes, cancellation_reason }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update appointment');
  }
  return res.json();
}

export async function adminSaveService(token: string, serviceData: Partial<Service>, isEdit = false) {
  const url = isEdit ? `${API_BASE}/admin/services/${serviceData.id}` : `${API_BASE}/admin/services`;
  const method = isEdit ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method,
    headers: getAdminHeaders(token),
    body: JSON.stringify(serviceData),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to save service');
  return json;
}

export async function adminSaveSettings(token: string, settings: Partial<ClinicSettings>) {
  const res = await fetch(`${API_BASE}/admin/settings`, {
    method: 'PUT',
    headers: getAdminHeaders(token),
    body: JSON.stringify(settings),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update settings');
  return json;
}

export async function adminChangePassword(token: string, currentPassword: string, newPassword: string) {
  const res = await fetch(`${API_BASE}/admin/change-password`, {
    method: 'PUT',
    headers: getAdminHeaders(token),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to change password');
  return json;
}

export async function adminGetInquiries(token: string): Promise<ContactInquiry[]> {
  const res = await fetch(`${API_BASE}/admin/inquiries`, {
    headers: getAdminHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to load inquiries');
  return res.json();
}

export async function adminToggleInquiryResolved(token: string, id: number, is_resolved: boolean) {
  const res = await fetch(`${API_BASE}/admin/inquiries/${id}`, {
    method: 'PATCH',
    headers: getAdminHeaders(token),
    body: JSON.stringify({ is_resolved }),
  });
  return res.json();
}

export interface SupabaseStatusInfo {
  connected: boolean;
  tableExists: boolean;
  projectId: string;
  url: string;
  error?: string;
  setupSql: string;
  totalSyncedCount: number;
  totalPendingCount: number;
}

export async function getSupabaseStatus(token: string): Promise<SupabaseStatusInfo> {
  const res = await fetch(`${API_BASE}/admin/supabase-status`, {
    headers: getAdminHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to check Supabase status');
  return res.json();
}

export async function syncAllToSupabase(token: string): Promise<{
  totalAttempted: number;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}> {
  const res = await fetch(`${API_BASE}/admin/supabase-sync-all`, {
    method: 'POST',
    headers: getAdminHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to sync records to Supabase');
  return res.json();
}

