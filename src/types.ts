export interface ClinicSettings {
  id: number;
  business_name: string;
  tagline: string;
  category: string;
  lead_doctor: string;
  doctor_qualifications: string;
  experience_years: number;
  address: string;
  area: string;
  city: string;
  postal_code: string;
  phone: string;
  secondary_phone?: string;
  email: string;
  website: string;
  maps_url: string;
  google_rating: number;
  review_count: number;
  opening_time: string;
  closing_time: string;
  break_start?: string;
  break_end?: string;
  closed_days: string;
  slot_interval_minutes: number;
  lead_time_hours: number;
  cancellation_notice_hours: number;
  cancellation_policy: string;
  currency_symbol: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  duration_minutes: number;
  price_display: string;
  price_inr?: number;
  is_price_variable: number;
  badge?: string;
  is_active: number;
  sort_order: number;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  qualifications: string;
  experience_years: number;
  specialties: string;
  bio: string;
  is_active: number;
  display_order: number;
}

export interface Review {
  id: number;
  author_name: string;
  rating: number;
  review_date: string;
  review_text: string;
  treatment_type: string;
  verified_platform: string;
}

export interface Slot {
  time: string;
  endTime: string;
  displayTime: string;
  displayEndTime: string;
  available: boolean;
  reason?: string;
}

export interface Appointment {
  id: number;
  booking_reference: string;
  service_id: string;
  staff_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: 'confirmed' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show';
  notes?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  service_name?: string;
  price_display?: string;
  service_description?: string;
  service_category?: string;
  staff_name?: string;
  staff_role?: string;
  clinic_address?: string;
  clinic_phone?: string;
}

export interface AdminUser {
  id: number;
  username: string;
  name: string;
  role: string;
}

export interface ContactInquiry {
  id: number;
  name: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  created_at: string;
  is_resolved: number;
}
