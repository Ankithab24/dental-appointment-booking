import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Shield,
  MapPin,
  Sparkles,
  ChevronRight,
  Printer,
  CalendarPlus,
  MessageSquare
} from 'lucide-react';
import { Service, StaffMember, Slot, Appointment, ClinicSettings } from '../types.ts';
import { fetchServices, fetchStaff, fetchAvailability, bookAppointment } from '../api.ts';

interface BookingWizardProps {
  initialServiceId?: string;
  clinicSettings: ClinicSettings | null;
  onClose?: () => void;
  onViewBooking?: (reference: string, phone: string) => void;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  initialServiceId,
  clinicSettings,
  onClose,
  onViewBooking,
}) => {
  // Step 1 to 7
  const [step, setStep] = useState<number>(1);

  // Data collections
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Selected Booking Parameters
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // Availability State
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [availabilityMessage, setAvailabilityMessage] = useState<string>('');

  // Customer Details Form (Step 5)
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [visitType, setVisitType] = useState<string>('New Patient');

  // Submission & Confirmed Booking (Step 7)
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [confirmedAppt, setConfirmedAppt] = useState<Appointment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Filter category in Step 1
  const [serviceCategory, setServiceCategory] = useState<string>('all');
  const [serviceSearch, setServiceSearch] = useState<string>('');

  // 1. Fetch initial services and staff
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingData(true);
        const [servicesRes, staffRes] = await Promise.all([
          fetchServices(false),
          fetchStaff(),
        ]);
        setServices(servicesRes);
        setStaffList(staffRes);

        // Preselect service if provided
        if (initialServiceId) {
          const match = servicesRes.find((s) => s.id === initialServiceId);
          if (match) setSelectedService(match);
        } else if (servicesRes.length > 0) {
          setSelectedService(servicesRes[0]);
        }

        // Default to lead doctor
        if (staffRes.length > 0) {
          setSelectedStaff(staffRes[0]);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to load booking choices');
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, [initialServiceId]);

  // Set default initial date to tomorrow or next business day
  useEffect(() => {
    if (!selectedDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      // If tomorrow is Sunday (0), move to Monday
      if (tomorrow.getDay() === 0) {
        tomorrow.setDate(tomorrow.getDate() + 1);
      }
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      setSelectedDate(`${yyyy}-${mm}-${dd}`);
    }
  }, [selectedDate]);

  // 2. Fetch slots when Date, Service, or Staff changes
  useEffect(() => {
    if (selectedDate && selectedService) {
      const targetService = selectedService;
      async function loadSlots() {
        setLoadingSlots(true);
        setAvailabilityMessage('');
        try {
          const staffId = selectedStaff ? selectedStaff.id : 'dr-ashwini';
          const res = await fetchAvailability(selectedDate, targetService.id, staffId);
          if (res.isClosed) {
            setAvailableSlots([]);
            setAvailabilityMessage(res.reason || 'Clinic is closed on this day.');
          } else {
            setAvailableSlots(res.slots || []);
            if (res.slots.length === 0) {
              setAvailabilityMessage('No slots available on this date. Please select another date.');
            }
          }
          // Reset selected slot if it's no longer valid
          setSelectedSlot(null);
        } catch (err: any) {
          setAvailabilityMessage(err.message || 'Unable to check slot availability.');
        } finally {
          setLoadingSlots(false);
        }
      }
      loadSlots();
    }
  }, [selectedDate, selectedService, selectedStaff]);

  // Filtered services
  const categories = ['all', ...Array.from(new Set(services.map((s) => s.category)))];
  const filteredServices = services.filter((s) => {
    const matchesCat = serviceCategory === 'all' || s.category === serviceCategory;
    const matchesSearch =
      !serviceSearch ||
      s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      s.description.toLowerCase().includes(serviceSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Generate calendar dates for next 30 days
  const calendarDates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const isSunday = d.getDay() === 0;
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthLabel = d.toLocaleDateString('en-US', { month: 'short' });
    const dateNum = d.getDate();
    return {
      dateStr,
      dayLabel,
      monthLabel,
      dateNum,
      isSunday,
      isToday: i === 0,
    };
  });

  // Step progression validation
  const handleNext = () => {
    setErrorMessage('');
    if (step === 1) {
      if (!selectedService) {
        setErrorMessage('Please select a dental service to continue.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedStaff) {
        setErrorMessage('Please select a dental practitioner.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!selectedDate) {
        setErrorMessage('Please select an appointment date.');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      if (!selectedSlot) {
        setErrorMessage('Please select an available consultation time slot.');
        return;
      }
      setStep(5);
    } else if (step === 5) {
      if (!customerName.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      const cleanPhone = customerPhone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        setErrorMessage('Please enter a valid 10-digit mobile phone number (e.g., 98860 98901).');
        return;
      }
      setStep(6);
    } else if (step === 6) {
      handleConfirmBooking();
    }
  };

  const handleBack = () => {
    setErrorMessage('');
    if (step > 1 && step < 7) {
      setStep(step - 1);
    }
  };

  // Submit Final Booking (Step 6 -> Step 7)
  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedSlot || !selectedDate) return;
    setSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        serviceId: selectedService.id,
        staffId: selectedStaff ? selectedStaff.id : 'dr-ashwini',
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        appointmentDate: selectedDate,
        startTime: selectedSlot.time,
        notes: `[${visitType}] ${notes}`.trim(),
      };

      const result = await bookAppointment(payload);
      setConfirmedAppt(result.appointment);
      setStep(7);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Unable to confirm your booking. The selected slot might have been taken. Please choose another slot.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Separate morning vs evening slots
  const morningSlots = availableSlots.filter((s) => {
    const h = parseInt(s.time.split(':')[0], 10);
    return h < 14;
  });
  const eveningSlots = availableSlots.filter((s) => {
    const h = parseInt(s.time.split(':')[0], 10);
    return h >= 14;
  });

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-w-4xl mx-auto my-6 sm:my-8">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-5 sm:p-6 border-b border-teal-800/40">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Online Dental Appointment Portal</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white mt-1">
              {step === 7 ? 'Appointment Confirmed' : "Book Consultation with Dr. Ashwini's Smile Zone"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Gokulam 1st Stage, Mysuru • Precision Care • Verified Availability
            </p>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition"
              aria-label="Close booking modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step Progress Bar (Steps 1-6) */}
        {step < 7 && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-2">
              <span className="text-teal-300 font-semibold">
                Step {step} of 6:{' '}
                {step === 1 && 'Select Service'}
                {step === 2 && 'Choose Specialist'}
                {step === 3 && 'Pick Date'}
                {step === 4 && 'Select Time Slot'}
                {step === 5 && 'Patient Details'}
                {step === 6 && 'Review & Confirm'}
              </span>
              <span className="text-slate-400">{Math.round((step / 6) * 100)}% completed</span>
            </div>
            <div className="w-full bg-slate-800/90 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-400 to-teal-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 6) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Error alert banner */}
      {errorMessage && (
        <div className="mx-6 mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Form Body */}
      <div className="p-6 sm:p-8">
        {loadingData ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 border-4 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-600 font-medium">Loading clinic services and live schedule...</p>
          </div>
        ) : (
          <>
            {/* STEP 1: SELECT SERVICE */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Step 1: Choose Your Dental Treatment</h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Select a dental procedure. Each service lists duration and verified pricing.
                  </p>
                </div>

                {/* Category filter tabs */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setServiceCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        serviceCategory === cat
                          ? 'bg-teal-800 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat === 'all' ? 'All Treatments' : cat}
                    </button>
                  ))}
                </div>

                {/* Service Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
                  {filteredServices.map((service) => {
                    const isSelected = selectedService?.id === service.id;
                    return (
                      <div
                        key={service.id}
                        onClick={() => setSelectedService(service)}
                        className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-teal-700 bg-teal-50/70 shadow-sm ring-2 ring-teal-700/20'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {service.category}
                          </span>
                          {service.badge && (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              {service.badge}
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-sm text-slate-900 mt-2">{service.name}</h4>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                          {service.description}
                        </p>

                        <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Clock className="w-3.5 h-3.5 text-teal-700" />
                            {service.duration_minutes} mins
                          </span>
                          <span className="font-semibold text-teal-900">{service.price_display}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: SELECT SPECIALIST */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Step 2: Select Dental Practitioner</h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Appointments are supervised by Lead Senior Prosthodontist Dr. Ashwini Budanur.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {staffList.map((staff) => {
                    const isSelected = selectedStaff?.id === staff.id;
                    return (
                      <div
                        key={staff.id}
                        onClick={() => setSelectedStaff(staff)}
                        className={`p-5 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-teal-700 bg-teal-50/70 shadow-sm ring-2 ring-teal-700/20'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-xl bg-teal-800 text-white flex items-center justify-center font-display font-bold text-lg shrink-0">
                              {staff.name
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-900 text-base">{staff.name}</h4>
                                {staff.id === 'dr-ashwini' && (
                                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                                    Lead Specialist
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-teal-800 font-semibold">{staff.role}</p>
                              <p className="text-xs text-slate-500">
                                {staff.qualifications} • {staff.experience_years}+ Years Experience
                              </p>
                            </div>
                          </div>

                          <div className="text-xs text-slate-600 sm:text-right">
                            <span className="font-medium text-slate-700">Specialties:</span>
                            <p className="text-slate-500 max-w-xs">{staff.specialties}</p>
                          </div>
                        </div>

                        <p className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600 leading-relaxed">
                          {staff.bio}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: SELECT DATE */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Step 3: Choose Appointment Date</h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    The clinic operates Monday through Saturday (9:30 AM – 9:00 PM). Sundays are reserved for emergencies.
                  </p>
                </div>

                {/* Quick Date Carousel */}
                <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-7 gap-2.5 max-h-[380px] overflow-y-auto p-1">
                  {calendarDates.map((d) => {
                    const isSelected = selectedDate === d.dateStr;
                    return (
                      <button
                        key={d.dateStr}
                        type="button"
                        disabled={d.isSunday}
                        onClick={() => setSelectedDate(d.dateStr)}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                          d.isSunday
                            ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                            : isSelected
                            ? 'bg-teal-800 text-white border-teal-800 shadow-md scale-105'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-teal-700 hover:bg-teal-50/50'
                        }`}
                      >
                        <span className={`text-[11px] font-medium uppercase ${isSelected ? 'text-teal-200' : 'text-slate-500'}`}>
                          {d.dayLabel}
                        </span>
                        <span className="text-xl font-bold mt-0.5">{d.dateNum}</span>
                        <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-teal-200' : 'text-slate-400'}`}>
                          {d.monthLabel}
                        </span>
                        {d.isSunday && <span className="text-[9px] text-rose-500 mt-1 font-semibold">Closed</span>}
                        {d.isToday && !d.isSunday && (
                          <span className={`text-[9px] mt-1 font-semibold ${isSelected ? 'text-teal-200' : 'text-teal-700'}`}>
                            Today
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-teal-700" />
                    <span>
                      Selected Date:{' '}
                      <strong className="text-slate-900">
                        {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </strong>
                    </span>
                  </div>
                  <span className="text-teal-700 font-medium">Standard Hours: 9:30 AM – 9:00 PM</span>
                </div>
              </div>
            )}

            {/* STEP 4: SELECT TIME SLOT */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Step 4: Select Available Time Slot</h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Live schedule computed for {selectedService?.name} ({selectedService?.duration_minutes} mins) with{' '}
                    {selectedStaff?.name}.
                  </p>
                </div>

                {loadingSlots ? (
                  <div className="py-12 text-center">
                    <div className="w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs text-slate-500">Calculating real-time doctor availability...</p>
                  </div>
                ) : availabilityMessage ? (
                  <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-center">
                    <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-900 text-sm">{availabilityMessage}</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Please return to Step 3 and pick another business day or call the clinic directly at +91 98860 98901.
                    </p>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="mt-4 px-4 py-2 text-xs font-semibold text-teal-800 bg-teal-100 hover:bg-teal-200 rounded-lg transition"
                    >
                      Change Date
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Morning & Midday Slots */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-teal-700" />
                        <span>Morning Session (09:30 AM – 01:30 PM)</span>
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                        {morningSlots.map((slot) => {
                          const isSelected = selectedSlot?.time === slot.time;
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={!slot.available}
                              onClick={() => setSelectedSlot(slot)}
                              className={`p-3 rounded-xl border text-center transition-all ${
                                !slot.available
                                  ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-50 line-through'
                                  : isSelected
                                  ? 'bg-teal-800 text-white border-teal-800 shadow-md ring-2 ring-teal-800/30 font-bold'
                                  : 'bg-white border-slate-200 text-slate-800 hover:border-teal-700 hover:bg-teal-50/60 font-semibold'
                              }`}
                              title={slot.reason || 'Click to select this slot'}
                            >
                              <div className="text-sm">{slot.displayTime}</div>
                              <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-teal-200' : 'text-slate-400'}`}>
                                to {slot.displayEndTime}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Clinic Sanitization break banner */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                      Midday Sterilization & Clinical Break: 1:30 PM – 4:30 PM
                    </div>

                    {/* Evening Slots */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-teal-700" />
                        <span>Evening Session (04:30 PM – 09:00 PM)</span>
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                        {eveningSlots.map((slot) => {
                          const isSelected = selectedSlot?.time === slot.time;
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={!slot.available}
                              onClick={() => setSelectedSlot(slot)}
                              className={`p-3 rounded-xl border text-center transition-all ${
                                !slot.available
                                  ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-50 line-through'
                                  : isSelected
                                  ? 'bg-teal-800 text-white border-teal-800 shadow-md ring-2 ring-teal-800/30 font-bold'
                                  : 'bg-white border-slate-200 text-slate-800 hover:border-teal-700 hover:bg-teal-50/60 font-semibold'
                              }`}
                              title={slot.reason || 'Click to select this slot'}
                            >
                              <div className="text-sm">{slot.displayTime}</div>
                              <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-teal-200' : 'text-slate-400'}`}>
                                to {slot.displayEndTime}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: PATIENT DETAILS */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Step 5: Patient Contact Information</h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    We will send your confirmed booking reference and reminders to these contact coordinates.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Patient Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Smt. Rajeshwari / Mr. Arun Kumar"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Mobile Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+91 98860 98901"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 outline-hidden"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">SMS confirmation will be dispatched here.</p>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email Address (Optional)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Visit Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Visit Type</label>
                    <select
                      value={visitType}
                      onChange={(e) => setVisitType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 outline-hidden bg-white"
                    >
                      <option value="New Patient">New Patient (First Visit to Smile Zone)</option>
                      <option value="Follow-up">Existing Patient / Follow-up Visit</option>
                      <option value="Second Opinion">Second Opinion Consultation</option>
                      <option value="Emergency Consultation">Dental Pain / Emergency Assessment</option>
                    </select>
                  </div>
                </div>

                {/* Dental Symptoms / Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Dental Symptoms or Special Notes (Optional)
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="e.g. Lower right molar pain when chewing, sensitivity to cold water, inquiry about invisible aligners..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 outline-hidden"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 flex items-start gap-3 text-xs text-teal-900">
                  <Shield className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Privacy Commitment:</strong> Patient data is kept strictly confidential and used exclusively for your clinical appointments at Dr. Ashwini's Smile Zone.
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: COMPLETE BOOKING SUMMARY */}
            {step === 6 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Step 6: Review Your Booking Details</h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Please review your appointment summary before clicking Confirm.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-200">
                    <div>
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Treatment</span>
                      <h4 className="font-bold text-slate-900 text-base mt-0.5">{selectedService?.name}</h4>
                      <p className="text-xs text-teal-800 font-semibold">{selectedService?.category}</p>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Consulting Specialist</span>
                      <h4 className="font-bold text-slate-900 text-base mt-0.5">{selectedStaff?.name}</h4>
                      <p className="text-xs text-slate-600">{selectedStaff?.role}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-200">
                    <div>
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Date</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">
                        {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Time & Duration</span>
                      <p className="font-bold text-teal-900 text-sm mt-0.5">
                        {selectedSlot?.displayTime} ({selectedService?.duration_minutes} mins)
                      </p>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Estimated Fee</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">
                        {selectedService?.price_display}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200">
                    <div>
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Patient Information</span>
                      <p className="font-semibold text-slate-900 text-sm mt-0.5">{customerName}</p>
                      <p className="text-xs text-slate-600">{customerPhone}</p>
                      {customerEmail && <p className="text-xs text-slate-500">{customerEmail}</p>}
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Clinic Location</span>
                      <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                        <MapPin className="w-3.5 h-3.5 text-teal-700 inline mr-1" />
                        No 24, 3rd Cross, Gokulam Main Road, Gokulam 1st Stage, Mysuru - 570002
                      </p>
                      <p className="text-[11px] text-teal-700 font-medium mt-1">Wheelchair accessible entrance</p>
                    </div>
                  </div>

                  {notes && (
                    <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                      <strong>Notes:</strong> {notes}
                    </div>
                  )}

                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <p className="font-semibold">Cancellation Policy:</p>
                    <p>
                      {clinicSettings?.cancellation_policy ||
                        'Appointments can be rescheduled or cancelled up to 4 hours in advance with zero penalty. Please call +91 98860 98901 for immediate changes.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: CONFIRMED BOOKING */}
            {step === 7 && confirmedAppt && (
              <div className="space-y-6 py-2 text-center animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle className="w-10 h-10 text-teal-700" />
                </div>

                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                    Booking Confirmed & Saved in Database
                  </span>
                  <h3 className="text-2xl font-display font-bold text-slate-900 mt-2">
                    We Look Forward to Welcoming You!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-1">
                    Your appointment has been registered at Dr. Ashwini's Smile Zone, Gokulam, Mysuru.
                  </p>
                </div>

                {/* Unique Booking Reference Badge */}
                <div className="max-w-md mx-auto p-4 rounded-2xl bg-gradient-to-br from-teal-900 to-slate-900 text-white shadow-xl text-left">
                  <div className="flex items-center justify-between text-xs text-teal-300 border-b border-teal-800/80 pb-2 mb-3">
                    <span>OFFICIAL BOOKING REFERENCE</span>
                    <span className="bg-teal-500/20 px-2 py-0.5 rounded text-[11px] font-mono text-teal-200">
                      CONFIRMED
                    </span>
                  </div>

                  <div className="text-center py-2">
                    <span className="font-mono text-2xl sm:text-3xl font-extrabold tracking-widest text-teal-300">
                      {confirmedAppt.booking_reference}
                    </span>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Keep this reference code to view or reschedule your visit anytime.
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-teal-800/80 grid grid-cols-2 gap-2 text-xs text-slate-300">
                    <div>
                      <span className="text-slate-400 block text-[10px]">PATIENT</span>
                      <strong className="text-white">{confirmedAppt.customer_name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">SCHEDULE</span>
                      <strong className="text-white">
                        {confirmedAppt.appointment_date} at {confirmedAppt.start_time}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Quick Utility Actions */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <a
                    href={`https://wa.me/919886098901?text=${encodeURIComponent(
                      `Hello Dr. Ashwini's Smile Zone, I have booked an appointment under reference ${confirmedAppt.booking_reference} for ${confirmedAppt.service_name} on ${confirmedAppt.appointment_date} at ${confirmedAppt.start_time}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp Clinic Front Desk</span>
                  </a>

                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300 transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Summary</span>
                  </button>

                  {onViewBooking && (
                    <button
                      onClick={() => onViewBooking(confirmedAppt.booking_reference, confirmedAppt.customer_phone)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold shadow-md transition"
                    >
                      <span>Manage Booking</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Navigation Buttons (Steps 1-6) */}
      {step < 7 && !loadingData && (
        <div className="bg-slate-50 px-6 sm:px-8 py-4 border-t border-slate-200 flex items-center justify-between gap-4">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <span className="text-xs text-slate-500">Need help? Call +91 98860 98901</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={handleNext}
              className={`inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md transition ${
                submitting
                  ? 'bg-teal-800/60 cursor-wait'
                  : 'bg-teal-800 hover:bg-teal-900 active:scale-[0.98]'
              }`}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Reserving Slot...</span>
                </>
              ) : step === 6 ? (
                <>
                  <span>Confirm Appointment</span>
                  <CheckCircle className="w-4 h-4 text-teal-300" />
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
