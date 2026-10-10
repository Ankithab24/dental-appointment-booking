import React from 'react';
import {
  Calendar,
  MapPin,
  Phone,
  Clock,
  Star,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Award,
  HeartHandshake,
  Microscope,
  Stethoscope
} from 'lucide-react';
import { ClinicSettings, Service, Review } from '../types.ts';
import { clinicImages } from '../assets/images/index.ts';

interface HomePageProps {
  clinicSettings: ClinicSettings | null;
  services: Service[];
  reviews: Review[];
  onOpenBooking: (serviceId?: string) => void;
  onNavigate: (tab: string) => void;
  onOpenLightbox: (imgUrl: string, title: string, desc: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  clinicSettings,
  services,
  reviews,
  onOpenBooking,
  onNavigate,
  onOpenLightbox,
}) => {
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
    google_rating: 4.9,
    review_count: 70,
    maps_url: 'https://maps.app.goo.gl/hwZj43DEjjFUSJY97',
  };

  const featuredServices = services.slice(0, 6);

  return (
    <div className="space-y-20 sm:space-y-24">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-teal-950 text-white pt-12 pb-20 sm:pt-16 sm:pb-28">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Headlines & Actions */}
            <div className="lg:col-span-7 space-y-6">
              {/* Verified Trust Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/15 border border-teal-400/30 text-teal-300 text-xs font-semibold backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                <span>Premier Dental Care in Gokulam, Mysuru</span>
                <span className="text-teal-400 font-bold">• 25+ Years Excellence</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.15]">
                Precision Prosthodontics, Dental Implants &{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-teal-200 to-cyan-200">
                  Gentle Family Care
                </span>
              </h1>

              {/* Verified Clinical Intro */}
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                Led by <strong className="text-white font-semibold">{settings.lead_doctor}</strong> (BDS, MDS). We combine 25+ years of specialized restorative prosthodontic mastery with painless rotary endodontics, digital intraoral scanning, and compassionate individualized care.
              </p>

              {/* Key Trust Stats Pill Group */}
              <div className="flex flex-wrap gap-3 pt-1">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-white">{settings.google_rating} ★</span>
                  <span className="text-slate-400">({settings.review_count}+ Google Reviews)</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span>Hospital-Grade Sterilization</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  <span>Wheelchair Accessible</span>
                </div>
              </div>

              {/* Primary Call to Actions */}
              <div className="flex flex-wrap items-center gap-3.5 pt-3">
                <button
                  onClick={() => onOpenBooking()}
                  className="px-6 py-3.5 text-sm font-bold text-slate-950 bg-gradient-to-r from-teal-300 via-teal-200 to-emerald-200 hover:from-teal-200 hover:to-emerald-100 rounded-xl shadow-lg shadow-teal-500/20 active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-teal-950" />
                  <span>Book an Appointment</span>
                  <ArrowRight className="w-4 h-4 text-teal-950" />
                </button>

                <button
                  onClick={() => onNavigate('services')}
                  className="px-5 py-3.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl backdrop-blur-md transition flex items-center gap-2"
                >
                  <span>View Services</span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>

                <a
                  href={settings.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3.5 text-sm font-medium text-teal-300 hover:text-white transition flex items-center gap-1.5"
                >
                  <MapPin className="w-4 h-4 text-teal-400" />
                  <span>Get Directions</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>
            </div>

            {/* Right Column: Hero Visual Card */}
            <div className="lg:col-span-5">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition duration-500" />
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-slate-800">
                  <img
                    src={clinicImages.reception}
                    alt="Dr. Ashwini's Smile Zone Dental Clinic Reception and Waiting Lounge in Mysuru"
                    className="w-full h-80 sm:h-96 object-cover object-center group-hover:scale-105 transition-transform duration-700 cursor-pointer"
                    onClick={() =>
                      onOpenLightbox(
                        clinicImages.reception,
                        "Dr. Ashwini's Smile Zone Reception",
                        'Calming, modern patient lounge in Gokulam 1st Stage, Mysuru.'
                      )
                    }
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />

                  {/* Overlay Badge */}
                  <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-white/10 flex items-center justify-between">
                    <div>
                      <h4 className="text-white text-xs font-bold uppercase tracking-wider text-teal-400">
                        Modern Clinic Ambiance
                      </h4>
                      <p className="text-white text-sm font-semibold mt-0.5">
                        No 24, 3rd Cross, Gokulam Main Rd
                      </p>
                      <p className="text-xs text-slate-400">Monday – Saturday: 9:30 AM – 9:00 PM</p>
                    </div>

                    <button
                      onClick={() => onOpenBooking()}
                      className="px-3.5 py-2 rounded-lg bg-teal-800 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CLINICAL HIGHLIGHTS & TRUST INDICATORS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-teal-700" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">25+ Years Experience</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Dr. Ashwini Budanur is a Senior Prosthodontist (BDS, MDS) with deep expertise in advanced reconstructive, implant, and cosmetic dentistry.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-4">
              <HeartHandshake className="w-6 h-6 text-emerald-700" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Painless Dental Care</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              We employ gentle techniques, modern local anesthesia, and quiet rotary instruments to ensure a relaxing, pain-free dental experience.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-800 flex items-center justify-center mb-4">
              <Microscope className="w-6 h-6 text-cyan-700" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Digital 3D Technology</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Intraoral digital scanners, CAD/CAM zirconia milling, and digital smile preview software for millimeter-precise fits and natural smiles.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-800 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-indigo-700" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Class-B Autoclave Hygiene</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Multi-stage sterilization protocols, disposable PPE, and sterile pouching guarantee zero cross-contamination for patient safety.
            </p>
          </div>
        </div>
      </section>

      {/* 3. FEATURED SERVICES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold text-teal-800 uppercase tracking-wider bg-teal-50 px-3 py-1 rounded-full border border-teal-200/60">
              Verified Clinical Treatments
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
              Featured Services & Transparent Pricing
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              From routine preventive cleaning to full-mouth dental implants and ceramic smile makeovers.
            </p>
          </div>

          <button
            onClick={() => onNavigate('services')}
            className="text-xs sm:text-sm font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1.5 transition group"
          >
            <span>Browse All Treatments</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col justify-between hover:shadow-lg hover:border-teal-700/40 transition group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                    {service.category}
                  </span>
                  {service.badge && (
                    <span className="text-[11px] font-medium text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200/60">
                      {service.badge}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-base group-hover:text-teal-900 transition-colors">
                  {service.name}
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-3">
                  {service.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Verified Price</span>
                  <span className="font-bold text-sm text-slate-900">{service.price_display}</span>
                </div>

                <button
                  onClick={() => onOpenBooking(service.id)}
                  className="px-3.5 py-2 text-xs font-semibold text-teal-900 bg-teal-50 hover:bg-teal-800 hover:text-white rounded-xl transition-all shadow-xs"
                >
                  Book Service
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. MEET LEAD SPECIALIST: DR. ASHWINI */}
      <section className="bg-slate-100/70 border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Visual Operatory Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-white group">
                <img
                  src={clinicImages.operatory}
                  alt="Dr. Ashwini's Smile Zone Operatory Room in Mysuru"
                  className="w-full h-80 sm:h-96 object-cover group-hover:scale-105 transition-transform duration-700 cursor-pointer"
                  onClick={() =>
                    onOpenLightbox(
                      clinicImages.operatory,
                      'Modern Operatory Suite',
                      'Ergonomic dental chair with serene garden view and high-precision lighting.'
                    )
                  }
                />
                <div className="p-4 bg-white border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">Advanced Dental Operatory</span>
                    <span className="text-teal-700 font-medium">Gokulam 1st Stage</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Doctor Bio and Credentials */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-900 text-xs font-bold">
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Lead Specialist Profile</span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
                Dr. Ashwini Budanur Longegowda
              </h2>
              <p className="text-xs sm:text-sm text-teal-900 font-semibold">
                Senior Prosthodontist & Implantologist • BDS, MDS (Prosthodontics & Maxillofacial Prosthetics)
              </p>

              <p className="text-sm text-slate-600 leading-relaxed">
                With more than <strong>25 years of specialized clinical experience</strong>, Dr. Ashwini is one of Mysuru's most trusted prosthodontists. She focuses on restorative rehabilitations, painless root canal endodontics, natural-looking dental implants, and smile aesthetics.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Full Mouth Rehabilitation & Geriatric Dentures</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>CAD/CAM Zirconia Crowns & Ceramic Veneers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Single-Sitting Painless Rotary Root Canals</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Titanium & Zirconia Dental Implants</span>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onOpenBooking()}
                  className="px-5 py-3 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs sm:text-sm shadow-md transition"
                >
                  Book Consultation with Dr. Ashwini
                </button>
                <button
                  onClick={() => onNavigate('about')}
                  className="px-4 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs sm:text-sm border border-slate-300 transition"
                >
                  Read Full Background
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PHOTO TOUR (Reception, Operatory, Tech, Sterilization) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-teal-800 uppercase tracking-wider bg-teal-50 px-3 py-1 rounded-full border border-teal-200/60">
            Clinic Infrastructure
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            Inside Dr. Ashwini's Smile Zone
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Experience clinical precision blended with calming, hygienic hospitality in Mysuru.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div
            onClick={() =>
              onOpenLightbox(
                clinicImages.reception,
                'Welcoming Reception Lounge',
                'Soothing interiors, wheelchair accessibility, and warm patient reception in Gokulam.'
              )
            }
            className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition cursor-pointer border border-slate-200"
          >
            <img
              src={clinicImages.reception}
              alt="Clinic Reception"
              className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="p-3.5 bg-white">
              <h4 className="font-bold text-xs text-slate-900">Reception & Patient Lounge</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Calming spa-like ambiance</p>
            </div>
          </div>

          <div
            onClick={() =>
              onOpenLightbox(
                clinicImages.operatory,
                'Modern Dental Operatory',
                'Ergonomic dental chair equipped with digital X-rays and garden daylight view.'
              )
            }
            className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition cursor-pointer border border-slate-200"
          >
            <img
              src={clinicImages.operatory}
              alt="Dental Operatory"
              className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="p-3.5 bg-white">
              <h4 className="font-bold text-xs text-slate-900">Advanced Operatory Suite</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Quiet rotary instrumentation</p>
            </div>
          </div>

          <div
            onClick={() =>
              onOpenLightbox(
                clinicImages.technology,
                'Digital 3D Intraoral Scanner',
                'No gooey impression trays: high accuracy digital tooth scans for crowns & aligners.'
              )
            }
            className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition cursor-pointer border border-slate-200"
          >
            <img
              src={clinicImages.technology}
              alt="Digital Scanner"
              className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="p-3.5 bg-white">
              <h4 className="font-bold text-xs text-slate-900">Digital 3D Smile Studio</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">CAD/CAM crown designing</p>
            </div>
          </div>

          <div
            onClick={() =>
              onOpenLightbox(
                clinicImages.sterilization,
                'Hospital Grade Sterilization Room',
                'Strict autoclaving and vacuum sealed pouching ensure zero cross-infection.'
              )
            }
            className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition cursor-pointer border border-slate-200"
          >
            <img
              src={clinicImages.sterilization}
              alt="Sterilization Room"
              className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="p-3.5 bg-white">
              <h4 className="font-bold text-xs text-slate-900">Autoclave Sterilization Suite</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Hospital infection control</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. VERIFIED PATIENT REVIEWS (4.9 ★) */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>Verified Patient Testimonials</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
                Rated 4.9 Stars on Google
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Real patient feedback from residents across Mysuru and Karnataka.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-xs">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <span className="font-bold text-white">4.9 / 5.0</span>
              <span className="text-slate-400">• 70+ Verified Reviews</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <div className="flex text-amber-400">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-slate-400 text-[11px]">{rev.review_date}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                    "{rev.review_text}"
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-700 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">{rev.author_name}</span>
                    <span className="text-teal-400 text-[11px]">{rev.treatment_type}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                    {rev.verified_platform}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. OPENING HOURS & LOCATION CARD */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg grid grid-cols-1 lg:grid-cols-12">
          {/* Hours & Details */}
          <div className="lg:col-span-6 p-8 sm:p-10 space-y-6">
            <div>
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wider bg-teal-50 px-3 py-1 rounded-full border border-teal-200/60">
                Clinic Hours & Address
              </span>
              <h2 className="font-display text-2xl font-bold text-slate-900 mt-2">
                Visit Dr. Ashwini's Smile Zone
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Conveniently located on Gokulam Main Road in Mysuru with parking and wheelchair accessibility.
              </p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <MapPin className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-semibold">Address</strong>
                  <span className="text-slate-600">
                    No 24, 3rd Cross, Gokulam Main Road, Gokulam 1st Stage, Mysuru, Karnataka - 570002
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <Clock className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <div className="w-full">
                  <strong className="text-slate-900 block font-semibold">Working Hours</strong>
                  <div className="flex justify-between py-0.5 text-slate-700">
                    <span>Monday – Saturday</span>
                    <span className="font-medium text-slate-900">09:30 AM – 09:00 PM</span>
                  </div>
                  <div className="flex justify-between py-0.5 text-slate-500 text-xs">
                    <span>Midday break & sanitization</span>
                    <span>01:30 PM – 04:30 PM</span>
                  </div>
                  <div className="flex justify-between py-0.5 text-rose-600">
                    <span>Sunday</span>
                    <span className="font-medium">Closed (Emergencies on call)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <Phone className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-semibold">Direct Clinic Lines</strong>
                  <div className="flex flex-wrap gap-3 mt-1">
                    <a href={`tel:${settings.phone}`} className="text-teal-800 font-bold hover:underline">
                      {settings.phone}
                    </a>
                    {settings.secondary_phone && (
                      <a href={`tel:${settings.secondary_phone}`} className="text-slate-600 hover:underline">
                        {settings.secondary_phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <a
                href={settings.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs sm:text-sm font-semibold transition flex items-center gap-2 shadow-md"
              >
                <MapPin className="w-4 h-4 text-teal-300" />
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <button
                onClick={() => onOpenBooking()}
                className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold border border-slate-300 transition"
              >
                Book Appointment
              </button>
            </div>
          </div>

          {/* Interactive Google Maps Frame */}
          <div className="lg:col-span-6 bg-slate-100 min-h-[350px] relative">
            <iframe
              title="Dr. Ashwini's Smile Zone Dental Clinic Location Map Mysuru"
              src="https://maps.google.com/maps?q=12.3304109,76.6308178&hl=en&z=16&output=embed"
              className="w-full h-full min-h-[350px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* 8. FINAL HIGH-IMPACT BOOKING BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-8 sm:p-12 relative overflow-hidden shadow-2xl border border-teal-800/40">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-400/30">
              Personalized Dental Health
            </span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
              Ready for a Healthy, Radiant Smile?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Book a detailed oral examination and digital scan with Dr. Ashwini Budanur. Choose your preferred time slot online with immediate confirmation and zero waiting hassle.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onOpenBooking()}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-300 to-emerald-200 text-slate-950 font-bold text-sm shadow-lg hover:shadow-teal-400/20 active:scale-[0.98] transition flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Your Consultation Online</span>
              </button>

              <a
                href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 transition flex items-center gap-2"
              >
                <Phone className="w-4 h-4 text-teal-300" />
                <span>Call Clinic Directly</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
