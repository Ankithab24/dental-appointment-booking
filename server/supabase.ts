import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { db } from './db.ts';

// Configured with user's Supabase project credentials
export const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID || 'zimolpwlvuilckylzkwl';
export const SUPABASE_URL = process.env.SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_PiJChDNiLu5DozsjMAfOZA_-ru8Gv9m';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });
  }
  return supabaseClient;
}

// Initialize SQLite table for tracking Supabase sync status
export function initSupabaseSyncTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS supabase_sync_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_reference TEXT NOT NULL,
      status TEXT NOT NULL, -- 'synced' | 'pending' | 'failed'
      response_data TEXT,
      error_message TEXT,
      synced_at TEXT NOT NULL
    );
  `);
}

export const SUPABASE_SETUP_SQL = `-- Run this in your Supabase SQL Editor:
-- Direct URL: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new

CREATE TABLE IF NOT EXISTS public.appointments (
  id BIGSERIAL PRIMARY KEY,
  booking_reference TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  service_name TEXT NOT NULL,
  service_id TEXT,
  staff_name TEXT,
  staff_id TEXT,
  appointment_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  price_display TEXT,
  status TEXT DEFAULT 'confirmed',
  notes TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Allow anon key (website frontend/backend) to insert, view, and update
DROP POLICY IF EXISTS "Allow anon insert to appointments" ON public.appointments;
CREATE POLICY "Allow anon insert to appointments"
ON public.appointments FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon select to appointments" ON public.appointments;
CREATE POLICY "Allow anon select to appointments"
ON public.appointments FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon update to appointments" ON public.appointments;
CREATE POLICY "Allow anon update to appointments"
ON public.appointments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Optional table for Patient Contact Inquiries
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon insert to contact_inquiries" ON public.contact_inquiries;
CREATE POLICY "Allow anon insert to contact_inquiries"
ON public.contact_inquiries FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon select to contact_inquiries" ON public.contact_inquiries;
CREATE POLICY "Allow anon select to contact_inquiries"
ON public.contact_inquiries FOR SELECT TO anon, authenticated USING (true);
`;

export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  tableExists: boolean;
  projectId: string;
  url: string;
  error?: string;
  setupSql: string;
  totalSyncedCount: number;
  totalPendingCount: number;
}> {
  const supabase = getSupabase();
  let connected = false;
  let tableExists = false;
  let errorMsg: string | undefined = undefined;

  try {
    const { error } = await supabase.from('appointments').select('id').limit(1);
    if (!error) {
      connected = true;
      tableExists = true;
    } else if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
      // Endpoint connected, but table schema not yet generated in Supabase
      connected = true;
      tableExists = false;
      errorMsg = "Table 'public.appointments' does not exist yet in Supabase.";
    } else {
      connected = true;
      errorMsg = error.message;
    }
  } catch (err: any) {
    connected = false;
    errorMsg = err.message || 'Unable to reach Supabase API';
  }

  // Count synced vs pending from local DB
  let totalSyncedCount = 0;
  let totalPendingCount = 0;
  try {
    const syncedRow = db.prepare("SELECT COUNT(*) as count FROM supabase_sync_logs WHERE status = 'synced'").get() as any;
    totalSyncedCount = syncedRow?.count || 0;

    const totalApptsRow = db.prepare('SELECT COUNT(*) as count FROM appointments').get() as any;
    const totalAppts = totalApptsRow?.count || 0;
    totalPendingCount = Math.max(0, totalAppts - totalSyncedCount);
  } catch (e) {
    // Ignore if table not ready
  }

  return {
    connected,
    tableExists,
    projectId: SUPABASE_PROJECT_ID,
    url: SUPABASE_URL,
    error: errorMsg,
    setupSql: SUPABASE_SETUP_SQL,
    totalSyncedCount,
    totalPendingCount,
  };
}

export async function syncAppointmentToSupabase(appointment: any): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  const payload = {
    booking_reference: appointment.booking_reference,
    customer_name: appointment.customer_name,
    customer_phone: appointment.customer_phone,
    customer_email: appointment.customer_email || null,
    service_name: appointment.service_name || 'Dental Consultation',
    service_id: appointment.service_id || null,
    staff_name: appointment.staff_name || 'Dr. Ashwini Budanur',
    staff_id: appointment.staff_id || null,
    appointment_date: appointment.appointment_date,
    start_time: appointment.start_time,
    end_time: appointment.end_time,
    duration_minutes: Number(appointment.duration_minutes) || 30,
    price_display: appointment.price_display || null,
    status: appointment.status || 'confirmed',
    notes: appointment.notes || null,
    cancellation_reason: appointment.cancellation_reason || null,
    created_at: appointment.created_at || now,
    updated_at: appointment.updated_at || now,
  };

  try {
    const { data, error } = await supabase
      .from('appointments')
      .upsert(payload, { onConflict: 'booking_reference' })
      .select();

    if (error) {
      console.warn('[Supabase Sync Warning]', error.message);
      // Record failure log
      db.prepare(`
        INSERT INTO supabase_sync_logs (booking_reference, status, error_message, synced_at)
        VALUES (?, 'failed', ?, ?)
      `).run(appointment.booking_reference, error.message, now);

      return {
        success: false,
        error: error.message,
      };
    }

    // Record success log
    db.prepare(`
      INSERT INTO supabase_sync_logs (booking_reference, status, response_data, synced_at)
      VALUES (?, 'synced', ?, ?)
    `).run(appointment.booking_reference, JSON.stringify(data), now);

    return {
      success: true,
      message: 'Successfully synced appointment to Supabase.',
    };
  } catch (err: any) {
    console.error('[Supabase Sync Error]', err);
    try {
      db.prepare(`
        INSERT INTO supabase_sync_logs (booking_reference, status, error_message, synced_at)
        VALUES (?, 'failed', ?, ?)
      `).run(appointment.booking_reference, err.message || 'Unknown network error', now);
    } catch {}

    return {
      success: false,
      error: err.message || 'Network error during Supabase sync',
    };
  }
}

export async function syncInquiryToSupabase(inquiry: any): Promise<void> {
  const supabase = getSupabase();
  try {
    await supabase.from('contact_inquiries').insert({
      name: inquiry.name,
      phone: inquiry.phone,
      email: inquiry.email || null,
      subject: inquiry.subject || null,
      message: inquiry.message,
      created_at: inquiry.created_at || new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Supabase Inquiry Sync Warning]', err);
  }
}

export async function syncAllPendingAppointments(): Promise<{
  totalAttempted: number;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}> {
  const appts = db.prepare(`
    SELECT 
      a.*,
      s.name as service_name,
      s.price_display,
      st.name as staff_name
    FROM appointments a
    LEFT JOIN services s ON a.service_id = s.id
    LEFT JOIN staff st ON a.staff_id = st.id
  `).all() as any[];

  let syncedCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const appt of appts) {
    const res = await syncAppointmentToSupabase(appt);
    if (res.success) {
      syncedCount++;
    } else {
      failedCount++;
      if (res.error && !errors.includes(res.error)) {
        errors.push(res.error);
      }
    }
  }

  return {
    totalAttempted: appts.length,
    syncedCount,
    failedCount,
    errors,
  };
}
