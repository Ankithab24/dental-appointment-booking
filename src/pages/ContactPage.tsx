import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ExternalLink,
  Send,
  CheckCircle,
  AlertCircle,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { ClinicSettings } from '../types.ts';
import { submitContact } from '../api.ts';

interface ContactPageProps {
  clinicSettings: ClinicSettings | null;
  onOpenBooking: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ clinicSettings, onOpenBooking }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Dental Inquiry');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const settings = clinicSettings || {
    business_name: "Dr. Ashwini's Smile Zone",
    lead_doctor: 'Dr. Ashwini Budanur Longegowda',
    address: 'No 24, 3rd Cross, Gokulam Main Road, Gokulam 1st Stage',
    city: 'Mysuru',
    postal_code: '570002',
    phone: '+91 98860 98901',
    secondary_phone: '+91 81479 48781',
    email: 'contact@ashwinismilezone.com',
    maps_url: 'https://maps.app.goo.gl/hwZj43DEjjFUSJY97',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) {
      setStatusMessage({ type: 'error', text: 'Please fill in your name, mobile phone number, and message.' });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await submitContact({ name, phone, email, subject, message });
      setStatusMessage({ type: 'success', text: res.message });
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to send message. Please call the clinic directly.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold text-teal-800 uppercase tracking-wider bg-teal-50 px-3.5 py-1.5 rounded-full border border-teal-200">
          Location & Inquiries
        </span>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900">
          Contact & Clinic Location
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Reach Dr. Ashwini's dental team in Gokulam, Mysuru. We are here to assist with appointments, emergency consultations, and general dental questions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Contact Info & Hours */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
            <h2 className="font-display font-bold text-xl text-slate-900">Clinic Coordinates</h2>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-start gap-3.5">
                <MapPin className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-semibold">Address</strong>
                  <span className="text-slate-600 leading-relaxed">
                    {settings.address}, Gokulam, {settings.city} - {settings.postal_code}, Karnataka, India
                  </span>
                  <div className="mt-2">
                    <a
                      href={settings.maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-teal-800 font-semibold hover:underline"
                    >
                      <span>Open in Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3.5 pt-2 border-t border-slate-100">
                <Phone className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-semibold">Phone Lines (Click to call)</strong>
                  <div className="space-y-1 mt-1">
                    <div>
                      <a
                        href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                        className="text-teal-900 font-bold hover:underline"
                      >
                        {settings.phone}
                      </a>
                      <span className="text-slate-400 text-xs ml-1.5">(Primary Reception)</span>
                    </div>
                    {settings.secondary_phone && (
                      <div>
                        <a
                          href={`tel:${settings.secondary_phone.replace(/\s+/g, '')}`}
                          className="text-slate-700 hover:text-teal-900"
                        >
                          {settings.secondary_phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3.5 pt-2 border-t border-slate-100">
                <Mail className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-semibold">Email</strong>
                  <a href={`mailto:${settings.email}`} className="text-slate-700 hover:text-teal-900">
                    {settings.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5 pt-2 border-t border-slate-100">
                <Clock className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <div className="w-full">
                  <strong className="text-slate-900 block font-semibold">Opening Hours</strong>
                  <div className="mt-1 space-y-1 text-slate-600 text-xs">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-800">Monday – Saturday:</span>
                      <span>09:30 AM – 09:00 PM</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Midday Break:</span>
                      <span>01:30 PM – 04:30 PM</span>
                    </div>
                    <div className="flex justify-between text-rose-600 font-medium">
                      <span>Sunday:</span>
                      <span>Closed (Emergency on request)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onOpenBooking}
                className="w-full py-3 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4 text-teal-200" />
                <span>Book Appointment Online</span>
              </button>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h2 className="font-display font-bold text-xl text-slate-900 mb-2">Send a Clinic Inquiry</h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-6">
              Have a question about a dental treatment, estimate, or follow-up? Send us a message and our front desk will reply promptly.
            </p>

            {statusMessage && (
              <div
                className={`p-4 rounded-xl mb-6 flex items-start gap-3 text-xs sm:text-sm ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <p>{statusMessage.text}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Smt. Suma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mobile Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98860 98901"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 outline-hidden bg-white"
                  >
                    <option value="General Consultation Inquiry">General Consultation Inquiry</option>
                    <option value="Dental Implants Assessment">Dental Implants Assessment</option>
                    <option value="Root Canal Treatment Question">Root Canal Treatment Question</option>
                    <option value="Clear Aligners / Braces Inquiry">Clear Aligners / Braces Inquiry</option>
                    <option value="Post-Treatment Follow-up">Post-Treatment Follow-up</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can Dr. Ashwini and our team help with your dental health?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 outline-hidden"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span>Sending Message...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Message to Clinic</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Embedded Map Section */}
      <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-md">
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm">Interactive Google Map Location</h3>
            <p className="text-xs text-slate-400">Gokulam 1st Stage, Mysuru, Karnataka</p>
          </div>
          <a
            href={settings.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-xs font-semibold transition"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Open in Google Maps App</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        </div>

        <iframe
          title="Dr. Ashwini's Smile Zone Dental Clinic Mysuru Map"
          src="https://maps.google.com/maps?q=12.3304109,76.6308178&hl=en&z=16&output=embed"
          className="w-full h-96 border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
};
