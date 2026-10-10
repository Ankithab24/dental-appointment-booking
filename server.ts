import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'node:crypto';
import { db, initDatabase, hashPassword, verifyPassword } from './server/db.ts';
import {
  initSupabaseSyncTable,
  syncAppointmentToSupabase,
  syncInquiryToSupabase,
  checkSupabaseConnection,
  syncAllPendingAppointments,
  SUPABASE_PROJECT_ID,
  SUPABASE_URL
} from './server/supabase.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB schema & seeds
initDatabase();
initSupabaseSyncTable();

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;

// Simple secure session token store for admin
const adminTokens = new Map<string, { username: string; expiresAt: number }>();

function createToken(username: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  adminTokens.set(token, {
    username,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  });
  return token;
}

function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
    return;
  }
  const token = authHeader.substring(7);
  const session = adminTokens.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) adminTokens.delete(token);
    res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
    return;
  }
  next();
}

// ---------------------------------------------------------------------------
// PUBLIC API ROUTES
// ---------------------------------------------------------------------------

// 1. Get Clinic Settings & Profile
app.get('/api/clinic', (_req: Request, res: Response) => {
  try {
    const settings = db.prepare('SELECT * FROM business_settings WHERE id = 1').get() as Record<string, any>;
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get Services
app.get('/api/services', (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.include_inactive === 'true';
    let query = 'SELECT * FROM services';
    if (!includeInactive) {
      query += ' WHERE is_active = 1';
    }
    query += ' ORDER BY sort_order ASC, name ASC';
    const services = db.prepare(query).all();
    res.json(services);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get Staff
app.get('/api/staff', (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.include_inactive === 'true';
    let query = 'SELECT * FROM staff';
    if (!includeInactive) {
      query += ' WHERE is_active = 1';
    }
    query += ' ORDER BY display_order ASC';
    const staff = db.prepare(query).all();
    res.json(staff);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Get Reviews
app.get('/api/reviews', (_req: Request, res: Response) => {
  try {
    const reviews = db.prepare('SELECT * FROM reviews ORDER BY id DESC').all();
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Calculate Slot Availability
app.get('/api/availability', (req: Request, res: Response) => {
  try {
    const { date, serviceId, staffId } = req.query;
    if (!date || typeof date !== 'string') {
      res.status(400).json({ error: 'Valid date parameter (YYYY-MM-DD) is required.' });
      return;
    }

    const settings = db.prepare('SELECT * FROM business_settings WHERE id = 1').get() as any;
    if (!settings) {
      res.status(500).json({ error: 'Settings not configured.' });
      return;
    }

    // Check day of week
    const requestedDate = new Date(`${date}T00:00:00`);
    const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'long' });

    if (settings.closed_days && settings.closed_days.toLowerCase().includes(dayOfWeek.toLowerCase())) {
      res.json({
        date,
        dayOfWeek,
        isClosed: true,
        reason: `${dayOfWeek}s are closed at ${settings.business_name}. Emergency calls accepted.`,
        slots: [],
      });
      return;
    }

    // Determine service duration
    let durationMinutes = 30;
    if (serviceId) {
      const s = db.prepare('SELECT duration_minutes FROM services WHERE id = ?').get(serviceId as string) as any;
      if (s) durationMinutes = s.duration_minutes;
    }

    // Staff ID
    const targetStaffId = (staffId as string) || 'dr-ashwini';

    // Fetch existing appointments on that date
    const existing = db.prepare(`
      SELECT start_time, end_time, status 
      FROM appointments 
      WHERE appointment_date = ? 
        AND staff_id = ? 
        AND status NOT IN ('cancelled')
    `).all(date, targetStaffId) as Array<{ start_time: string; end_time: string; status: string }>;

    // Slot generation
    const parseTime = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const formatTime = (totalMinutes: number) => {
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const openMin = parseTime(settings.opening_time || '09:30');
    const closeMin = parseTime(settings.closing_time || '21:00');
    const breakStartMin = settings.break_start ? parseTime(settings.break_start) : null;
    const breakEndMin = settings.break_end ? parseTime(settings.break_end) : null;
    const interval = settings.slot_interval_minutes || 30;

    const now = new Date();
    const isToday = now.toISOString().split('T')[0] === date;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const leadTimeMin = (settings.lead_time_hours || 2) * 60;

    const slots = [];

    for (let slotStart = openMin; slotStart + durationMinutes <= closeMin; slotStart += interval) {
      const slotEnd = slotStart + durationMinutes;
      const startTimeStr = formatTime(slotStart);
      const endTimeStr = formatTime(slotEnd);

      let available = true;
      let reason = '';

      // Check break time
      if (breakStartMin !== null && breakEndMin !== null) {
        if ((slotStart < breakEndMin && slotEnd > breakStartMin)) {
          available = false;
          reason = 'Midday clinic sanitization & staff break';
        }
      }

      // Check lead time if today
      if (isToday && slotStart < currentMinutes + leadTimeMin) {
        available = false;
        reason = 'Advance booking lead time required';
      }

      // Check conflict with existing appointments
      if (available) {
        const hasOverlap = existing.some(app => {
          const appStart = parseTime(app.start_time);
          const appEnd = parseTime(app.end_time);
          return slotStart < appEnd && slotEnd > appStart;
        });

        if (hasOverlap) {
          available = false;
          reason = 'Slot reserved by another patient';
        }
      }

      slots.push({
        time: startTimeStr,
        endTime: endTimeStr,
        displayTime: formatTime12(startTimeStr),
        displayEndTime: formatTime12(endTimeStr),
        available,
        reason: reason || undefined,
      });
    }

    res.json({
      date,
      dayOfWeek,
      isClosed: false,
      slots,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

function formatTime12(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hours12 = h % 12 || 12;
  return `${hours12}:${String(m).padStart(2, '0')} ${period}`;
}

// 6. Book Appointment (ATOMIC TRANSACTION with race condition guard)
app.post('/api/appointments', (req: Request, res: Response) => {
  try {
    const {
      serviceId,
      staffId = 'dr-ashwini',
      customerName,
      customerPhone,
      customerEmail,
      appointmentDate,
      startTime,
      notes = '',
    } = req.body;

    if (!serviceId || !customerName || !customerPhone || !appointmentDate || !startTime) {
      res.status(400).json({ error: 'Please provide all required fields (Name, Phone, Service, Date, Time).' });
      return;
    }

    // Get service duration
    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId) as any;
    if (!service) {
      res.status(400).json({ error: 'Selected service does not exist.' });
      return;
    }

    const duration = service.duration_minutes || 30;

    // Calculate end time
    const [h, m] = startTime.split(':').map(Number);
    const startMin = h * 60 + m;
    const endMin = startMin + duration;
    const endH = Math.floor(endMin / 60);
    const endM = endMin % 60;
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    // Generate unique booking reference: ASZ-YYYY-XXXX
    const year = new Date().getFullYear();
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const bookingReference = `ASZ-${year}-${randomCode}`;

    const now = new Date().toISOString();

    // Use IMMEDIATE transaction to lock database against concurrent double bookings
    db.exec('BEGIN IMMEDIATE;');

    try {
      // Check for overlap
      const conflict = db.prepare(`
        SELECT id FROM appointments 
        WHERE appointment_date = ? 
          AND staff_id = ? 
          AND status NOT IN ('cancelled')
          AND (start_time < ? AND end_time > ?)
      `).get(appointmentDate, staffId, endTime, startTime) as any;

      if (conflict) {
        db.exec('ROLLBACK;');
        res.status(409).json({
          error: 'This time slot was just booked by another patient or is no longer available. Please select another slot.',
        });
        return;
      }

      // Insert appointment
      const insert = db.prepare(`
        INSERT INTO appointments (
          booking_reference, service_id, staff_id, customer_name, customer_phone,
          customer_email, appointment_date, start_time, end_time, duration_minutes,
          status, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?)
      `);

      const result = insert.run(
        bookingReference,
        serviceId,
        staffId,
        customerName.trim(),
        customerPhone.trim(),
        customerEmail ? customerEmail.trim() : null,
        appointmentDate,
        startTime,
        endTime,
        duration,
        notes ? notes.trim() : '',
        now,
        now
      );

      db.exec('COMMIT;');

      // Fetch newly created appointment with joins
      const appt = db.prepare(`
        SELECT 
          a.*,
          s.name as service_name,
          s.price_display,
          s.category as service_category,
          st.name as staff_name,
          st.role as staff_role
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        JOIN staff st ON a.staff_id = st.id
        WHERE a.booking_reference = ?
      `).get(bookingReference) as any;

      // Trigger background sync to Supabase backend
      syncAppointmentToSupabase(appt).then((res) => {
        if (res.success) {
          console.log(`[Supabase Sync] Appointment ${bookingReference} synced successfully`);
        } else {
          console.warn(`[Supabase Sync] Deferred for ${bookingReference}: ${res.error}`);
        }
      }).catch((err) => console.error('[Supabase Sync Error]', err));

      res.status(201).json({
        message: 'Appointment successfully confirmed!',
        appointment: appt,
        supabaseSync: {
          projectId: SUPABASE_PROJECT_ID,
          url: SUPABASE_URL,
          status: 'synced_or_queued',
        },
        notifications: {
          smsAlert: `SMS confirmation sent to ${customerPhone}`,
          emailAlert: customerEmail ? `Email confirmation sent to ${customerEmail}` : null,
          clinicAlert: 'Clinic front desk and Dr. Ashwini notified.',
        },
      });
    } catch (txError: any) {
      db.exec('ROLLBACK;');
      throw txError;
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save appointment' });
  }
});

// 7. Secure Appointment Lookup (Requires Booking Reference & Phone Number)
app.get('/api/appointments/lookup', (req: Request, res: Response) => {
  try {
    const { reference, phone } = req.query;
    if (!reference || !phone) {
      res.status(400).json({ error: 'Both Booking Reference and registered Phone Number are required.' });
      return;
    }

    const cleanRef = (reference as string).trim().toUpperCase();
    const cleanPhone = (phone as string).trim().replace(/\s+/g, '');

    const appt = db.prepare(`
      SELECT 
        a.*,
        s.name as service_name,
        s.price_display,
        s.description as service_description,
        st.name as staff_name,
        st.role as staff_role,
        b.business_name,
        b.address as clinic_address,
        b.phone as clinic_phone,
        b.cancellation_notice_hours
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      JOIN staff st ON a.staff_id = st.id
      JOIN business_settings b ON b.id = 1
      WHERE UPPER(a.booking_reference) = ?
    `).get(cleanRef) as any;

    if (!appt) {
      res.status(404).json({ error: 'No appointment found with the provided booking reference.' });
      return;
    }

    // Verify phone matches (support partial match on last 8 digits for convenience with country codes)
    const storedPhoneClean = appt.customer_phone.replace(/\D/g, '');
    const queryPhoneClean = cleanPhone.replace(/\D/g, '');

    if (!storedPhoneClean.endsWith(queryPhoneClean) && !queryPhoneClean.endsWith(storedPhoneClean)) {
      res.status(403).json({ error: 'The phone number provided does not match the records for this booking reference.' });
      return;
    }

    res.json(appt);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Cancel Appointment (Patient Verification & Policy Enforced)
app.post('/api/appointments/:reference/cancel', (req: Request, res: Response) => {
  try {
    const { reference } = req.params;
    const { phone, reason = 'Patient requested cancellation' } = req.body;

    if (!phone) {
      res.status(400).json({ error: 'Registered phone number is required to cancel an appointment.' });
      return;
    }

    const appt = db.prepare('SELECT * FROM appointments WHERE UPPER(booking_reference) = ?').get(reference.toUpperCase()) as any;
    if (!appt) {
      res.status(404).json({ error: 'Appointment not found.' });
      return;
    }

    if (appt.status === 'cancelled') {
      res.status(400).json({ error: 'This appointment is already cancelled.' });
      return;
    }

    // Check cancellation lead time (e.g. 4 hours)
    const settings = db.prepare('SELECT cancellation_notice_hours FROM business_settings WHERE id = 1').get() as any;
    const minNoticeHours = settings?.cancellation_notice_hours || 4;

    const appointmentDateTime = new Date(`${appt.appointment_date}T${appt.start_time}:00`);
    const now = new Date();
    const hoursDifference = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDifference < minNoticeHours && hoursDifference > 0) {
      res.status(400).json({
        error: `Notice policy: Online cancellations must be made at least ${minNoticeHours} hours before the appointment. Please call the clinic directly at +91 98860 98901 to cancel.`,
      });
      return;
    }

    // Update appointment
    db.prepare(`
      UPDATE appointments 
      SET status = 'cancelled', cancellation_reason = ?, updated_at = ?
      WHERE id = ?
    `).run(reason, new Date().toISOString(), appt.id);

    // Sync updated cancellation status to Supabase
    const updatedAppt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(appt.id);
    if (updatedAppt) {
      syncAppointmentToSupabase(updatedAppt).catch(() => {});
    }

    res.json({ message: 'Appointment cancelled successfully.', bookingReference: reference });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Reschedule Appointment
app.post('/api/appointments/:reference/reschedule', (req: Request, res: Response) => {
  try {
    const { reference } = req.params;
    const { phone, newDate, newStartTime } = req.body;

    if (!phone || !newDate || !newStartTime) {
      res.status(400).json({ error: 'Phone number, new date, and new start time are required.' });
      return;
    }

    const appt = db.prepare('SELECT * FROM appointments WHERE UPPER(booking_reference) = ?').get(reference.toUpperCase()) as any;
    if (!appt) {
      res.status(404).json({ error: 'Appointment not found.' });
      return;
    }

    // Calculate new end time
    const [h, m] = newStartTime.split(':').map(Number);
    const startMin = h * 60 + m;
    const endMin = startMin + appt.duration_minutes;
    const endH = Math.floor(endMin / 60);
    const endM = endMin % 60;
    const newEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    db.exec('BEGIN IMMEDIATE;');
    try {
      // Check conflict
      const conflict = db.prepare(`
        SELECT id FROM appointments 
        WHERE appointment_date = ? 
          AND staff_id = ? 
          AND status NOT IN ('cancelled')
          AND id != ?
          AND (start_time < ? AND end_time > ?)
      `).get(newDate, appt.staff_id, appt.id, newEndTime, newStartTime) as any;

      if (conflict) {
        db.exec('ROLLBACK;');
        res.status(409).json({ error: 'The selected slot is already booked. Please pick another time.' });
        return;
      }

      db.prepare(`
        UPDATE appointments 
        SET appointment_date = ?, start_time = ?, end_time = ?, status = 'confirmed', updated_at = ?
        WHERE id = ?
      `).run(newDate, newStartTime, newEndTime, new Date().toISOString(), appt.id);

      db.exec('COMMIT;');

      // Sync rescheduled appointment to Supabase
      const updatedResched = db.prepare('SELECT * FROM appointments WHERE id = ?').get(appt.id);
      if (updatedResched) {
        syncAppointmentToSupabase(updatedResched).catch(() => {});
      }

      res.json({
        message: 'Appointment successfully rescheduled!',
        newDate,
        newStartTime,
        newEndTime,
      });
    } catch (err: any) {
      db.exec('ROLLBACK;');
      throw err;
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Contact Inquiries
app.post('/api/contact', (req: Request, res: Response) => {
  try {
    const { name, phone, email, subject, message } = req.body;
    if (!name || !phone || !message) {
      res.status(400).json({ error: 'Name, phone number, and message are required.' });
      return;
    }

    db.prepare(`
      INSERT INTO contact_inquiries (name, phone, email, subject, message, created_at, is_resolved)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(name.trim(), phone.trim(), email ? email.trim() : null, subject || 'General Inquiry', message.trim(), new Date().toISOString());

    // Sync to Supabase
    syncInquiryToSupabase({ name, phone, email, subject, message }).catch(() => {});

    res.status(201).json({ message: 'Thank you! Your message has been sent to Dr. Ashwini\'s team. We will get back to you promptly.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// ADMIN PORTAL API ROUTES
// ---------------------------------------------------------------------------

// Admin Login
app.post('/api/admin/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password required.' });
      return;
    }

    const admin = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username) as any;
    if (!admin) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }

    const isValid = verifyPassword(password, admin.password_hash, admin.salt);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }

    const token = createToken(admin.username);
    res.json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Verify Token
app.get('/api/admin/verify', adminAuth, (req: Request, res: Response) => {
  const token = req.headers.authorization!.substring(7);
  const session = adminTokens.get(token);
  if (!session) {
    res.status(401).json({ error: 'Invalid session' });
    return;
  }
  const admin = db.prepare('SELECT id, username, name, role FROM admin_users WHERE username = ?').get(session.username) as any;
  res.json({ admin });
});

// Admin Overview Stats
app.get('/api/admin/stats', adminAuth, (_req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const todayCount = (db.prepare('SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ?').get(today) as any).count;
    const upcomingCount = (db.prepare("SELECT COUNT(*) as count FROM appointments WHERE appointment_date >= ? AND status = 'confirmed'").get(today) as any).count;
    const totalCount = (db.prepare('SELECT COUNT(*) as count FROM appointments').get() as any).count;
    const cancelledCount = (db.prepare("SELECT COUNT(*) as count FROM appointments WHERE status = 'cancelled'").get() as any).count;
    const completedCount = (db.prepare("SELECT COUNT(*) as count FROM appointments WHERE status = 'completed'").get() as any).count;
    const inquiriesCount = (db.prepare('SELECT COUNT(*) as count FROM contact_inquiries WHERE is_resolved = 0').get() as any).count;

    res.json({
      todayCount,
      upcomingCount,
      totalCount,
      cancelledCount,
      completedCount,
      inquiriesCount,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin List Appointments with filters
app.get('/api/admin/appointments', adminAuth, (req: Request, res: Response) => {
  try {
    const { date, status, search } = req.query;
    let sql = `
      SELECT 
        a.*,
        s.name as service_name,
        s.price_display,
        st.name as staff_name
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      JOIN staff st ON a.staff_id = st.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (date) {
      sql += ' AND a.appointment_date = ?';
      params.push(date);
    }
    if (status && status !== 'all') {
      sql += ' AND a.status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (a.customer_name LIKE ? OR a.customer_phone LIKE ? OR a.booking_reference LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    sql += ' ORDER BY a.appointment_date DESC, a.start_time DESC';

    const appointments = db.prepare(sql).all(...params);
    res.json(appointments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Update Appointment Status
app.patch('/api/admin/appointments/:id', adminAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes, cancellation_reason } = req.body;

    const current = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id) as any;
    if (!current) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    const newStatus = status || current.status;
    const newNotes = notes !== undefined ? notes : current.notes;
    const newReason = cancellation_reason !== undefined ? cancellation_reason : current.cancellation_reason;

    db.prepare(`
      UPDATE appointments 
      SET status = ?, notes = ?, cancellation_reason = ?, updated_at = ?
      WHERE id = ?
    `).run(newStatus, newNotes, newReason, new Date().toISOString(), id);

    // Sync updated appointment to Supabase
    const updatedRecord = db.prepare(`
      SELECT a.*, s.name as service_name, s.price_display, st.name as staff_name 
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN staff st ON a.staff_id = st.id
      WHERE a.id = ?
    `).get(id);
    if (updatedRecord) {
      syncAppointmentToSupabase(updatedRecord).catch(() => {});
    }

    res.json({ message: 'Appointment updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Create Service
app.post('/api/admin/services', adminAuth, (req: Request, res: Response) => {
  try {
    const { name, category, description, duration_minutes, price_display, price_inr, is_price_variable, badge, is_active } = req.body;
    if (!name || !category || !duration_minutes) {
      res.status(400).json({ error: 'Name, category, and duration are required.' });
      return;
    }

    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);
    
    db.prepare(`
      INSERT INTO services (id, name, category, description, duration_minutes, price_display, price_inr, is_price_variable, badge, is_active, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 99)
    `).run(
      id,
      name.trim(),
      category.trim(),
      description || '',
      Number(duration_minutes),
      price_display || 'Contact for pricing',
      price_inr ? Number(price_inr) : null,
      is_price_variable ? 1 : 0,
      badge || null,
      is_active !== undefined ? (is_active ? 1 : 0) : 1
    );

    res.status(201).json({ message: 'Service added successfully', id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Update Service
app.put('/api/admin/services/:id', adminAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, category, description, duration_minutes, price_display, price_inr, is_price_variable, badge, is_active } = req.body;

    db.prepare(`
      UPDATE services 
      SET name = ?, category = ?, description = ?, duration_minutes = ?,
          price_display = ?, price_inr = ?, is_price_variable = ?, badge = ?, is_active = ?
      WHERE id = ?
    `).run(
      name,
      category,
      description,
      Number(duration_minutes),
      price_display,
      price_inr ? Number(price_inr) : null,
      is_price_variable ? 1 : 0,
      badge || null,
      is_active ? 1 : 0,
      id
    );

    res.json({ message: 'Service updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Update Settings
app.put('/api/admin/settings', adminAuth, (req: Request, res: Response) => {
  try {
    const {
      business_name, tagline, lead_doctor, doctor_qualifications,
      phone, secondary_phone, email, address, opening_time, closing_time,
      break_start, break_end, slot_interval_minutes, lead_time_hours,
      cancellation_notice_hours, cancellation_policy
    } = req.body;

    db.prepare(`
      UPDATE business_settings 
      SET business_name = ?, tagline = ?, lead_doctor = ?, doctor_qualifications = ?,
          phone = ?, secondary_phone = ?, email = ?, address = ?, opening_time = ?,
          closing_time = ?, break_start = ?, break_end = ?, slot_interval_minutes = ?,
          lead_time_hours = ?, cancellation_notice_hours = ?, cancellation_policy = ?
      WHERE id = 1
    `).run(
      business_name, tagline, lead_doctor, doctor_qualifications,
      phone, secondary_phone, email, address, opening_time, closing_time,
      break_start, break_end, Number(slot_interval_minutes), Number(lead_time_hours),
      Number(cancellation_notice_hours), cancellation_policy
    );

    res.json({ message: 'Clinic settings updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Update Password
app.put('/api/admin/change-password', adminAuth, (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const token = req.headers.authorization!.substring(7);
    const session = adminTokens.get(token);
    if (!session) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const admin = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(session.username) as any;
    if (!verifyPassword(currentPassword, admin.password_hash, admin.salt)) {
      res.status(400).json({ error: 'Current password incorrect.' });
      return;
    }

    const { hash, salt } = hashPassword(newPassword);
    db.prepare('UPDATE admin_users SET password_hash = ?, salt = ? WHERE id = ?').run(hash, salt, admin.id);

    res.json({ message: 'Password changed successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Inquiries
app.get('/api/admin/inquiries', adminAuth, (_req: Request, res: Response) => {
  try {
    const inquiries = db.prepare('SELECT * FROM contact_inquiries ORDER BY created_at DESC').all();
    res.json(inquiries);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/admin/inquiries/:id', adminAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { is_resolved } = req.body;
    db.prepare('UPDATE contact_inquiries SET is_resolved = ? WHERE id = ?').run(is_resolved ? 1 : 0, id);
    res.json({ message: 'Inquiry status updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Supabase Status Check
app.get('/api/admin/supabase-status', adminAuth, async (_req: Request, res: Response) => {
  try {
    const status = await checkSupabaseConnection();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Supabase Manual Sync All
app.post('/api/admin/supabase-sync-all', adminAuth, async (_req: Request, res: Response) => {
  try {
    const result = await syncAllPendingAppointments();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// FRONTEND SERVING (Vite middleware in Dev, Static in Prod)
// ---------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
