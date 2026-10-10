import React, { useState, useEffect } from 'react';
import {
  Search,
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Printer,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { Appointment, Slot, ClinicSettings } from '../types.ts';
import { lookupAppointment, cancelAppointment, rescheduleAppointment, fetchAvailability } from '../api.ts';

interface ManageBookingPageProps {
  initialReference?: string;
  initialPhone?: string;
  clinicSettings: ClinicSettings | null;
  onOpenNewBooking: () => void;
}

export const ManageBookingPage: React.FC<ManageBookingPageProps> = ({
  initialReference = '',
  initialPhone = '',
  clinicSettings,
  onOpenNewBooking,
}) => {
  const [reference, setReference] = useState(initialReference);
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [error, setError] = useState<string>('');
  const [successNotice, setSuccessNotice] = useState<string>('');

  // Cancel Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of plans');
  const [cancelling, setCancelling] = useState(false);

  // Reschedule Modal State
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState<Slot | null>(null);
  const [rescheduleSlots, setRescheduleSlots] = useState<Slot[]>([]);
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  // Auto-search if initial parameters provided
  useEffect(() => {
    if (initialReference && initialPhone) {
      handleLookup();
    }
  }, [initialReference, initialPhone]);

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!reference.trim() || !phone.trim()) {
      setError('Please enter both your Booking Reference (e.g. ASZ-2026-1001) and your registered Phone Number.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessNotice('');

    try {
      const data = await lookupAppointment(reference.trim(), phone.trim());
      setAppointment(data);
    } catch (err: any) {
      setAppointment(null);
      setError(err.message || 'No booking found matching this reference and phone number.');
    } finally {
      setLoading(false);
    }
  };

  // Cancel Execution
  const handleCancel = async () => {
    if (!appointment) return;
    setCancelling(true);
    setError('');

    try {
      await cancelAppointment(appointment.booking_reference, phone, cancelReason);
      setSuccessNotice('Your appointment has been successfully cancelled.');
      setShowCancelModal(false);
      // Refresh appointment
      const updated = await lookupAppointment(appointment.booking_reference, phone);
      setAppointment(updated);
    } catch (err: any) {
      setError(err.message || 'Could not cancel appointment.');
    } finally {
      setCancelling(false);
    }
  };

  // Fetch slots for rescheduling
  useEffect(() => {
    if (showRescheduleModal && rescheduleDate && appointment) {
      const currentAppt = appointment;
      async function loadRescheduleSlots() {
        setLoadingRescheduleSlots(true);
        try {
          const res = await fetchAvailability(rescheduleDate, currentAppt.service_id, currentAppt.staff_id);
          setRescheduleSlots(res.slots || []);
        } catch (err: any) {
          setError(err.message || 'Failed to fetch slots for this date.');
        } finally {
          setLoadingRescheduleSlots(false);
        }
      }
      loadRescheduleSlots();
    }
  }, [showRescheduleModal, rescheduleDate, appointment]);

  const handleReschedule = async () => {
    if (!appointment || !rescheduleDate || !rescheduleSlot) {
      setError('Please select a new date and time slot.');
      return;
    }

    setRescheduling(true);
    setError('');

    try {
      await rescheduleAppointment(
        appointment.booking_reference,
        phone,
        rescheduleDate,
        rescheduleSlot.time
      );
      setSuccessNotice('Your appointment has been successfully rescheduled!');
      setShowRescheduleModal(false);
      // Refresh
      const updated = await lookupAppointment(appointment.booking_reference, phone);
      setAppointment(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to reschedule appointment. The slot may have been taken.');
    } finally {
      setRescheduling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold text-teal-800 uppercase tracking-wider bg-teal-50 px-3.5 py-1.5 rounded-full border border-teal-200">
          Patient Portal
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">
          Manage Your Dental Appointment
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Look up your booking, view practitioner notes, reschedule your visit, or cancel in accordance with clinic policy.
        </p>
      </div>

      {/* Verification Lookup Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleLookup} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Booking Reference <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value.toUpperCase())}
                placeholder="e.g. ASZ-2026-1001"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Registered Mobile Phone <span className="text-rose-500">*</span>
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

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              Need assistance finding your code? Call <strong className="text-teal-900">+91 98860 98901</strong>
            </span>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs sm:text-sm shadow-md transition flex items-center gap-2"
            >
              {loading ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <Search className="w-4 h-4 text-teal-200" />
                  <span>Look Up Booking</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error / Success Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p>{successNotice}</p>
        </div>
      )}

      {/* Appointment Result Card */}
      {appointment && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          {/* Top Banner */}
          <div className="bg-slate-900 text-white p-5 sm:p-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-teal-300 font-mono">
                <span>REF:</span>
                <span className="font-bold text-white text-sm">{appointment.booking_reference}</span>
              </div>
              <h2 className="font-display font-bold text-lg sm:text-xl text-white mt-1">
                {appointment.service_name}
              </h2>
            </div>

            {/* Status Pill */}
            <div>
              {appointment.status === 'confirmed' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Confirmed</span>
                </span>
              )}
              {appointment.status === 'completed' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Completed</span>
                </span>
              )}
              {appointment.status === 'cancelled' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancelled</span>
                </span>
              )}
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Appointment Date
                </span>
                <p className="font-bold text-slate-900 text-sm mt-1 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-teal-700" />
                  <span>{appointment.appointment_date}</span>
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Time Slot
                </span>
                <p className="font-bold text-teal-900 text-sm mt-1 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-700" />
                  <span>
                    {appointment.start_time} - {appointment.end_time} ({appointment.duration_minutes}m)
                  </span>
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Specialist
                </span>
                <p className="font-bold text-slate-900 text-sm mt-1">
                  {appointment.staff_name || "Dr. Ashwini Budanur"}
                </p>
                <span className="text-xs text-slate-500">{appointment.staff_role}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Estimated Fee
                </span>
                <p className="font-bold text-slate-900 text-sm mt-1">
                  {appointment.price_display}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Patient Contact Info
                </span>
                <p className="font-semibold text-slate-900 text-sm">{appointment.customer_name}</p>
                <p className="text-slate-600 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-teal-700" />
                  <span>{appointment.customer_phone}</span>
                </p>
                {appointment.customer_email && (
                  <p className="text-slate-600">{appointment.customer_email}</p>
                )}
                {appointment.notes && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <strong>Notes:</strong> {appointment.notes}
                  </div>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Clinic Location & Directions
                </span>
                <p className="text-slate-700 leading-relaxed">
                  <MapPin className="w-3.5 h-3.5 text-teal-700 inline mr-1" />
                  No 24, 3rd Cross, Gokulam Main Road, Gokulam 1st Stage, Mysuru, Karnataka - 570002
                </p>
                <p className="text-teal-700 font-medium">Wheelchair accessible entrance available</p>
                <div className="pt-2">
                  <a
                    href="https://maps.app.goo.gl/hwZj43DEjjFUSJY97"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-teal-800 font-bold hover:underline"
                  >
                    <span>View directions on Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Actions Toolbar */}
            {appointment.status === 'confirmed' && (
              <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setRescheduleDate(appointment.appointment_date);
                      setShowRescheduleModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-semibold border border-teal-200 transition flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-teal-700" />
                    <span>Reschedule Time</span>
                  </button>

                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Cancel Appointment</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Slip</span>
                  </button>

                  <a
                    href={`https://wa.me/919886098901?text=${encodeURIComponent(
                      `Hello Dr. Ashwini's Smile Zone, regarding my booking ${appointment.booking_reference} for ${appointment.appointment_date}...`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Clinic</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && appointment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Reschedule Appointment</h3>
              <button onClick={() => setShowRescheduleModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select New Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-teal-700 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select New Time Slot</label>
                {loadingRescheduleSlots ? (
                  <div className="py-6 text-center text-xs text-slate-500">Checking availability...</div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                    {rescheduleSlots
                      .filter((s) => s.available)
                      .map((s) => (
                        <button
                          key={s.time}
                          type="button"
                          onClick={() => setRescheduleSlot(s)}
                          className={`p-2 rounded-lg text-xs font-semibold border transition ${
                            rescheduleSlot?.time === s.time
                              ? 'bg-teal-800 text-white border-teal-800'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          {s.displayTime}
                        </button>
                      ))}
                    {rescheduleSlots.filter((s) => s.available).length === 0 && (
                      <p className="col-span-3 text-center text-xs text-slate-400 py-3">
                        No available slots on this date.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                onClick={handleReschedule}
                disabled={rescheduling || !rescheduleSlot}
                className="px-5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                {rescheduling ? 'Updating...' : 'Confirm New Time'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && appointment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-slate-900 text-base">Cancel Appointment?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel booking <strong>{appointment.booking_reference}</strong> scheduled for{' '}
              <strong>{appointment.appointment_date}</strong> at <strong>{appointment.start_time}</strong>?
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Reason for cancellation (optional)</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-hidden"
              >
                <option value="Schedule conflict">Schedule conflict</option>
                <option value="Symptoms resolved">Symptoms resolved</option>
                <option value="Personal / Travel emergency">Personal / Travel emergency</option>
                <option value="Will rebook for next month">Will rebook for next month</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 text-[11px] text-amber-900 border border-amber-200">
              {clinicSettings?.cancellation_policy ||
                'Appointments may be cancelled up to 4 hours before the scheduled time with zero fee.'}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Keep Appointment
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
