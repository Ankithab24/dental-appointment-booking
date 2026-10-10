import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import path from 'node:path';

const DB_PATH = path.resolve(process.cwd(), 'clinic_database.sqlite');
export const db = new DatabaseSync(DB_PATH);

// Helper for hashing passwords with PBKDF2
export function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')): { hash: string; salt: string } {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const checkHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return checkHash === hash;
}

export function initDatabase() {
  // Enable foreign keys and WAL mode
  db.exec('PRAGMA foreign_keys = ON;');

  // 1. Business Settings Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS business_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      business_name TEXT NOT NULL,
      tagline TEXT NOT NULL,
      category TEXT NOT NULL,
      lead_doctor TEXT NOT NULL,
      doctor_qualifications TEXT NOT NULL,
      experience_years INTEGER NOT NULL,
      address TEXT NOT NULL,
      area TEXT NOT NULL,
      city TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      phone TEXT NOT NULL,
      secondary_phone TEXT,
      email TEXT NOT NULL,
      website TEXT NOT NULL,
      maps_url TEXT NOT NULL,
      google_rating REAL NOT NULL,
      review_count INTEGER NOT NULL,
      opening_time TEXT NOT NULL,
      closing_time TEXT NOT NULL,
      break_start TEXT,
      break_end TEXT,
      closed_days TEXT NOT NULL,
      slot_interval_minutes INTEGER NOT NULL,
      lead_time_hours INTEGER NOT NULL,
      cancellation_notice_hours INTEGER NOT NULL,
      cancellation_policy TEXT NOT NULL,
      currency_symbol TEXT NOT NULL
    );
  `);

  // 2. Staff Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      qualifications TEXT NOT NULL,
      experience_years INTEGER NOT NULL,
      specialties TEXT NOT NULL,
      bio TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      display_order INTEGER NOT NULL DEFAULT 1
    );
  `);

  // 3. Services Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      price_display TEXT NOT NULL,
      price_inr INTEGER,
      is_price_variable INTEGER NOT NULL DEFAULT 0,
      badge TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 1
    );
  `);

  // 4. Appointments Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_reference TEXT UNIQUE NOT NULL,
      service_id TEXT NOT NULL,
      staff_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      appointment_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      notes TEXT,
      cancellation_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (service_id) REFERENCES services(id),
      FOREIGN KEY (staff_id) REFERENCES staff(id)
    );
  `);

  // Indexes for performance and conflict-free booking lookup
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_appointments_conflict 
    ON appointments (appointment_date, staff_id, status);
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_appointments_ref 
    ON appointments (booking_reference);
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_appointments_phone 
    ON appointments (customer_phone);
  `);

  // 5. Admin Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL
    );
  `);

  // 6. Verified Reviews Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      review_date TEXT NOT NULL,
      review_text TEXT NOT NULL,
      treatment_type TEXT NOT NULL,
      verified_platform TEXT NOT NULL DEFAULT 'Google Verified'
    );
  `);

  // 7. Contact Inquiries Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS contact_inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      is_resolved INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Seed default clinic data if not already present
  seedData();
}

function seedData() {
  // Check if business settings exist
  const existingSettings = db.prepare('SELECT id FROM business_settings WHERE id = 1').get();
  if (!existingSettings) {
    const insertSettings = db.prepare(`
      INSERT INTO business_settings (
        id, business_name, tagline, category, lead_doctor, doctor_qualifications,
        experience_years, address, area, city, postal_code, phone, secondary_phone,
        email, website, maps_url, google_rating, review_count, opening_time,
        closing_time, break_start, break_end, closed_days, slot_interval_minutes,
        lead_time_hours, cancellation_notice_hours, cancellation_policy, currency_symbol
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertSettings.run(
      1,
      "Dr. Ashwini's Smile Zone",
      'Advanced Restorative, Implant & Aesthetic Dentistry',
      'Dental Clinic',
      'Dr. Ashwini Budanur Longegowda',
      'BDS, MDS (Prosthodontics & Maxillofacial Prosthetics)',
      25,
      'No 24, 3rd Cross, Gokulam Main Road, Gokulam 1st Stage',
      'Gokulam 1st Stage',
      'Mysuru',
      '570002',
      '+91 98860 98901',
      '+91 81479 48781',
      'contact@ashwinismilezone.com',
      'https://ashwinismilezone.com',
      'https://maps.app.goo.gl/hwZj43DEjjFUSJY97',
      4.9,
      70,
      '09:30',
      '21:00',
      '13:30',
      '16:30',
      'Sunday',
      30,
      2,
      4,
      'Appointments can be rescheduled or cancelled up to 4 hours prior to the scheduled time without charge. For urgent dental emergencies, please call the clinic directly.',
      '₹'
    );
  }

  // Seed Staff
  const existingStaff = db.prepare('SELECT COUNT(*) as count FROM staff').get() as { count: number };
  if (existingStaff.count === 0) {
    const insertStaff = db.prepare(`
      INSERT INTO staff (id, name, role, qualifications, experience_years, specialties, bio, is_active, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStaff.run(
      'dr-ashwini',
      'Dr. Ashwini Budanur Longegowda',
      'Lead Senior Prosthodontist & Implantologist',
      'BDS, MDS (Prosthodontics)',
      25,
      'Prosthodontics, Dental Implants, Full-Mouth Rehab, Smile Design',
      'With over 25 years of specialized clinical excellence, Dr. Ashwini is a leading prosthodontist in Mysuru known for gentle, pain-free restorative care and precision smile design.',
      1,
      1
    );

    insertStaff.run(
      'dr-ortho-consultant',
      'Dr. K. N. Gowda',
      'Consultant Orthodontist & Dentofacial Orthopedics',
      'BDS, MDS (Orthodontics)',
      14,
      'Clear Aligners, Invisible Braces, Bite Correction',
      'Specialist in comprehensive orthodontics and modern clear aligner therapy for adolescents and adults.',
      1,
      2
    );

    insertStaff.run(
      'dr-associate-endo',
      'Dr. Sahana M.',
      'Associate Dental Surgeon (Endodontics & Restorative)',
      'BDS, PGDip Endodontics',
      8,
      'Rotary Root Canal, Aesthetic Restorations, Pediatric Care',
      'Experienced associate surgeon focusing on single-visit rotary endodontics and preventive pediatric dental treatments.',
      1,
      3
    );
  }

  // Seed Services
  const existingServices = db.prepare('SELECT COUNT(*) as count FROM services').get() as { count: number };
  if (existingServices.count === 0) {
    const insertService = db.prepare(`
      INSERT INTO services (id, name, category, description, duration_minutes, price_display, price_inr, is_price_variable, badge, is_active, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const defaultServices = [
      {
        id: 'oral-consultation',
        name: 'Comprehensive Oral Examination & 3D Digital Consultation',
        category: 'Consultation & Diagnostics',
        description: 'Detailed oral health check-up, digital radiography examination, intraoral camera analysis, and personalized treatment roadmap with Dr. Ashwini.',
        duration_minutes: 30,
        price_display: '₹500 consultation fee',
        price_inr: 500,
        is_price_variable: 0,
        badge: 'Recommended for First Visit',
        sort_order: 1,
      },
      {
        id: 'dental-implants',
        name: 'Dental Implants & 3D Guided Replacement',
        category: 'Prosthodontics & Implants',
        description: 'Titanium and zirconia precision dental implants for single or multiple missing teeth, restoring permanent natural mastication and aesthetics.',
        duration_minutes: 60,
        price_display: 'From ₹22,000 / implant',
        price_inr: 22000,
        is_price_variable: 1,
        badge: 'Lead Specialty',
        sort_order: 2,
      },
      {
        id: 'painless-root-canal',
        name: 'Painless Single-Sitting Rotary Root Canal (RCT)',
        category: 'Endodontics',
        description: 'Advanced computer-controlled rotary endodontics with precision apex locator, ensuring pain-free therapy and preservation of natural teeth in one visit.',
        duration_minutes: 60,
        price_display: 'From ₹4,500',
        price_inr: 4500,
        is_price_variable: 1,
        badge: 'Zero-Pain Guarantee',
        sort_order: 3,
      },
      {
        id: 'zirconia-crowns',
        name: 'Zirconia & Ceramic Crowns / Bridges',
        category: 'Prosthodontics & Implants',
        description: 'High-strength CAD/CAM monolithic zirconia and porcelain-fused-to-zirconia crowns custom shaded to match your natural smile with 10-15 year warranties.',
        duration_minutes: 45,
        price_display: 'From ₹6,500 / tooth',
        price_inr: 6500,
        is_price_variable: 1,
        badge: 'Prosthodontic Precision',
        sort_order: 4,
      },
      {
        id: 'smile-makeover-veneers',
        name: 'Cosmetic Smile Makeover & E-Max Ceramic Veneers',
        category: 'Aesthetic Dentistry',
        description: 'Custom ceramic laminate veneers, diastema closure, and digital smile design to correct chips, discolorations, and uneven teeth contours.',
        duration_minutes: 60,
        price_display: 'From ₹8,000 / tooth',
        price_inr: 8000,
        is_price_variable: 1,
        badge: 'Aesthetic Excellence',
        sort_order: 5,
      },
      {
        id: 'teeth-whitening',
        name: 'In-Office Laser / LED Teeth Whitening',
        category: 'Aesthetic Dentistry',
        description: 'Professional in-chair whitening session lightening stains from coffee, tea, and aging by up to 6–8 shades safely without enamel sensitivity.',
        duration_minutes: 45,
        price_display: '₹6,000',
        price_inr: 6000,
        is_price_variable: 0,
        badge: 'Instant Results',
        sort_order: 6,
      },
      {
        id: 'clear-aligners-braces',
        name: 'Orthodontic Assessment & Clear Aligners',
        category: 'Orthodontics',
        description: 'Modern invisible clear aligners and ceramic aesthetic brackets for tooth alignment, crooked teeth, overbite correction, and gap closure.',
        duration_minutes: 45,
        price_display: 'Assessment: ₹800 (Aligners from ₹45,000)',
        price_inr: 800,
        is_price_variable: 1,
        badge: 'Discreet Orthodontics',
        sort_order: 7,
      },
      {
        id: 'ultrasonic-scaling',
        name: 'Ultrasonic Scaling, Stain Polishing & Gum Care',
        category: 'Preventive Care',
        description: 'Gentle ultrasonic plaque and calculus removal followed by fluoride paste polishing to prevent gum bleeding, bad breath, and periodontitis.',
        duration_minutes: 30,
        price_display: '₹1,500',
        price_inr: 1500,
        is_price_variable: 0,
        badge: 'Essential Routine Care',
        sort_order: 8,
      },
      {
        id: 'wisdom-tooth-extraction',
        name: 'Impacted Wisdom Tooth Surgical Removal',
        category: 'Oral Surgery',
        description: 'Minimally traumatic surgical extraction of impacted, painful, or misaligned third molars performed under comfortable local anesthesia.',
        duration_minutes: 60,
        price_display: 'From ₹4,000',
        price_inr: 4000,
        is_price_variable: 1,
        badge: 'Minimally Invasive',
        sort_order: 9,
      },
      {
        id: 'pediatric-fluoride-care',
        name: 'Pediatric Dental Care & Pit/Fissure Sealants',
        category: 'Preventive Care',
        description: 'Child-friendly dental visits, preventive fluoride varnish treatments, and protective dental sealants for cavity-free growing smiles.',
        duration_minutes: 30,
        price_display: '₹1,200',
        price_inr: 1200,
        is_price_variable: 0,
        badge: 'Gentle Child Care',
        sort_order: 10,
      },
    ];

    for (const s of defaultServices) {
      insertService.run(
        s.id,
        s.name,
        s.category,
        s.description,
        s.duration_minutes,
        s.price_display,
        s.price_inr,
        s.is_price_variable,
        s.badge,
        1,
        s.sort_order
      );
    }
  }

  // Seed Verified Reviews
  const existingReviews = db.prepare('SELECT COUNT(*) as count FROM reviews').get() as { count: number };
  if (existingReviews.count === 0) {
    const insertReview = db.prepare(`
      INSERT INTO reviews (author_name, rating, review_date, review_text, treatment_type, verified_platform)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const reviews = [
      {
        author: 'Rajeshwari Sundaram',
        rating: 5,
        date: '2 weeks ago',
        text: "Dr. Ashwini is truly exceptional. I came with severe dental anxiety for my mother's full mouth crown bridge rehabilitation. Her gentle hands, patient explanation, and state-of-the-art clinic in Gokulam made the entire process painless. Best dental clinic in Mysore!",
        treatment: 'Full Mouth Crown & Bridge',
        source: 'Google Verified',
      },
      {
        author: 'Arun Kumar M.',
        rating: 5,
        date: '1 month ago',
        text: 'Had a single-sitting root canal done here. Zero pain during or after the procedure. The sterilization standards and modern equipment are top notch. Very transparent and warm doctor.',
        treatment: 'Rotary Root Canal',
        source: 'Google Verified',
      },
      {
        author: 'Priya Rao',
        rating: 5,
        date: '2 months ago',
        text: 'Got dental implants placed by Dr. Ashwini. Her 25+ years of experience as a Prosthodontist clearly shows. The fit and finish look 100% natural. The clinic ambiance is so serene and spotless.',
        treatment: 'Dental Implants',
        source: 'Google Verified',
      },
      {
        author: 'Dr. Venkatesh K. (Physician)',
        rating: 5,
        date: '3 months ago',
        text: 'Dr. Ashwini gives so much personal attention and does not recommend unnecessary treatments. Very hygienic clinic, prompt appointment timing, and courteous team. Highly recommended for families.',
        treatment: 'Comprehensive Checkup & Scaling',
        source: 'Google Verified',
      },
      {
        author: 'Ananya Deshmukh',
        rating: 5,
        date: '4 months ago',
        text: 'Got cosmetic veneers done before my wedding. The results exceeded my expectations. Dr. Ashwini planned the smile design digitally and walked me through each stage. Thank you Dr. Ashwini!',
        treatment: 'Cosmetic Veneers',
        source: 'Google Verified',
      },
    ];

    for (const r of reviews) {
      insertReview.run(r.author, r.rating, r.date, r.text, r.treatment, r.source);
    }
  }

  // Seed Admin User
  const existingAdmin = db.prepare('SELECT id FROM admin_users WHERE username = ?').get('admin');
  if (!existingAdmin) {
    const { hash, salt } = hashPassword('admin123');
    const insertAdmin = db.prepare(`
      INSERT INTO admin_users (username, password_hash, salt, name, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertAdmin.run('admin', hash, salt, 'Dr. Ashwini Budanur', 'admin', new Date().toISOString());
  }

  // Seed sample appointment to demonstrate active booking schedule
  const existingAppts = db.prepare('SELECT COUNT(*) as count FROM appointments').get() as { count: number };
  if (existingAppts.count === 0) {
    const today = new Date().toISOString().split('T')[0];
    const insertAppt = db.prepare(`
      INSERT INTO appointments (
        booking_reference, service_id, staff_id, customer_name, customer_phone,
        customer_email, appointment_date, start_time, end_time, duration_minutes,
        status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAppt.run(
      'ASZ-2026-1001',
      'oral-consultation',
      'dr-ashwini',
      'Manoj Kumar',
      '+91 98450 12345',
      'manoj.kumar@gmail.com',
      today,
      '10:30',
      '11:00',
      30,
      'confirmed',
      'Routine 6-month checkup and sensitivity evaluation.',
      new Date().toISOString(),
      new Date().toISOString()
    );

    insertAppt.run(
      'ASZ-2026-1002',
      'painless-root-canal',
      'dr-ashwini',
      'Deepa Hebbar',
      '+91 94480 67890',
      'deepa.h@yahoo.com',
      today,
      '16:30',
      '17:30',
      60,
      'confirmed',
      'Lower molar pain. First sitting scheduled.',
      new Date().toISOString(),
      new Date().toISOString()
    );
  }
}
