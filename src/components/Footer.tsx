import React from 'react';
import { MapPin, Phone, Mail, Clock, ShieldCheck, Heart, ExternalLink, Calendar, Star } from 'lucide-react';
import { ClinicSettings } from '../types.ts';

interface FooterProps {
  onNavigate: (tab: string) => void;
  clinicSettings: ClinicSettings | null;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, clinicSettings }) => {
  const settings = clinicSettings || {
    business_name: "Dr. Ashwini's Smile Zone",
    lead_doctor: 'Dr. Ashwini Budanur Longegowda',
    doctor_qualifications: 'BDS, MDS (Prosthodontics & Maxillofacial Prosthetics)',
    experience_years: 25,
    address: 'No 24, 3rd Cross, Gokulam Main Road, Gokulam 1st Stage',
    city: 'Mysuru',
    postal_code: '570002',
    phone: '+91 98860 98901',
    secondary_phone: '+91 81479 48781',
    email: 'contact@ashwinismilezone.com',
    maps_url: 'https://maps.app.goo.gl/hwZj43DEjjFUSJY97',
    google_rating: 4.9,
    review_count: 70,
  };

  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 pb-12 border-b border-slate-800/80">
          {/* Col 1: Clinic Overview & Credentials */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-800 text-white flex items-center justify-center font-display font-bold text-xl shadow-md">
                SZ
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-lg tracking-tight">
                  Dr. Ashwini's Smile Zone
                </h3>
                <p className="text-xs text-teal-400 font-medium">Dental Clinic & Implant Center</p>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">
              Led by <span className="text-slate-200 font-medium">{settings.lead_doctor}</span> (25+ years clinical expertise). Providing compassionate, pain-free restorative, prosthodontic, and aesthetic smile transformations in Gokulam, Mysuru.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <span className="font-semibold text-white">{settings.google_rating} ★</span>
              <span className="text-slate-400">({settings.review_count}+ Google Reviews)</span>
            </div>
          </div>

          {/* Col 2: Quick Links & Patient Navigation */}
          <div>
            <h4 className="text-white font-semibold text-sm tracking-wide uppercase mb-4 text-teal-400">
              Patient Care
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('services')}
                  className="hover:text-teal-300 transition text-left"
                >
                  Dental Implants & Full Mouth Rehab
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('services')}
                  className="hover:text-teal-300 transition text-left"
                >
                  Painless Single-Sitting Root Canals
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('services')}
                  className="hover:text-teal-300 transition text-left"
                >
                  CAD/CAM Zirconia Crowns & Veneers
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('services')}
                  className="hover:text-teal-300 transition text-left"
                >
                  Clear Aligners & Invisible Braces
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('manage')}
                  className="text-teal-400 hover:text-teal-300 transition flex items-center gap-1.5 font-medium"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Check or Reschedule Existing Booking</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Clinic Hours & Accessibility */}
          <div>
            <h4 className="text-white font-semibold text-sm tracking-wide uppercase mb-4 text-teal-400">
              Clinic Working Hours
            </h4>
            <div className="space-y-2.5 text-sm text-slate-300">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-200">Monday – Saturday</div>
                  <div className="text-xs text-slate-400">09:30 AM – 09:00 PM</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Midday break & sanitization: 1:30 PM – 4:30 PM
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2.5 pt-2 border-t border-slate-900">
                <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-200">Sunday</div>
                  <div className="text-xs text-slate-400">Closed (Emergency calls on request)</div>
                </div>
              </div>
              <div className="pt-2 text-xs text-slate-400">
                <span className="text-teal-400 font-medium">✓</span> Wheelchair accessible entrance & operatory
              </div>
            </div>
          </div>

          {/* Col 4: Verified Contact & Google Maps */}
          <div>
            <h4 className="text-white font-semibold text-sm tracking-wide uppercase mb-4 text-teal-400">
              Location & Contact
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-1" />
                <span className="text-slate-300 text-xs leading-relaxed">
                  {settings.address}, Gokulam, {settings.city} - {settings.postal_code}, Karnataka, India
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                <a
                  href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                  className="text-slate-200 hover:text-teal-300 font-medium text-xs transition"
                >
                  {settings.phone}
                </a>
              </div>

              {settings.secondary_phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                  <a
                    href={`tel:${settings.secondary_phone.replace(/\s+/g, '')}`}
                    className="text-slate-300 hover:text-teal-300 text-xs transition"
                  >
                    {settings.secondary_phone}
                  </a>
                </div>
              )}

              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-teal-400 shrink-0" />
                <a
                  href={`mailto:${settings.email}`}
                  className="text-slate-300 hover:text-teal-300 text-xs transition truncate"
                >
                  {settings.email}
                </a>
              </div>

              <div className="pt-2">
                <a
                  href={settings.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-900/60 hover:bg-teal-900 text-teal-200 text-xs font-medium border border-teal-700/50 transition"
                >
                  <MapPin className="w-3.5 h-3.5 text-teal-300" />
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Medical Ethics Notice */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} {settings.business_name}. All rights reserved. Registered Dental Health Provider in Karnataka.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => onNavigate('about')} className="hover:text-slate-200 transition">
              About Lead Specialist
            </button>
            <span>•</span>
            <button onClick={() => onNavigate('contact')} className="hover:text-slate-200 transition">
              Clinic Guidelines
            </button>
            <span>•</span>
            <button onClick={() => onNavigate('manage')} className="hover:text-slate-200 transition">
              Cancellation Policy
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
