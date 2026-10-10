import React from 'react';
import {
  Award,
  CheckCircle,
  GraduationCap,
  ShieldCheck,
  Calendar,
  Sparkles,
  MapPin,
  Heart,
  Stethoscope
} from 'lucide-react';
import { ClinicSettings, StaffMember } from '../types.ts';
import { clinicImages } from '../assets/images/index.ts';

interface AboutPageProps {
  clinicSettings: ClinicSettings | null;
  staffList: StaffMember[];
  onOpenBooking: () => void;
  onOpenLightbox: (imgUrl: string, title: string, desc: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  clinicSettings,
  staffList,
  onOpenBooking,
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
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-16">
      {/* Intro Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-5">
          <span className="text-xs font-bold text-teal-800 uppercase tracking-wider bg-teal-50 px-3.5 py-1.5 rounded-full border border-teal-200">
            About Dr. Ashwini's Smile Zone
          </span>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
            25+ Years of Specialized Prosthodontics & Patient-Centered Dental Excellence
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Established in Gokulam, Mysuru, <strong>Dr. Ashwini's Smile Zone</strong> was founded on a simple clinical belief: exceptional dental care must be gentle, meticulous, and completely transparent.
          </p>

          <p className="text-sm text-slate-600 leading-relaxed">
            As a Senior Prosthodontist and Implantologist, Dr. Ashwini Budanur brings over two and a half decades of specialized hospital and clinical expertise in replacing missing teeth, correcting bite irregularities, and designing natural smiles that last for decades.
          </p>

          <div className="pt-2 flex flex-wrap gap-4">
            <button
              onClick={onOpenBooking}
              className="px-6 py-3.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs sm:text-sm shadow-md transition flex items-center gap-2"
            >
              <Calendar className="w-4 h-4 text-teal-200" />
              <span>Schedule a Personal Consultation</span>
            </button>
          </div>
        </div>

        {/* Visual Card */}
        <div className="lg:col-span-5">
          <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-white">
            <img
              src={clinicImages.reception}
              alt="Dr. Ashwini's Smile Zone Clinic Interior"
              className="w-full h-80 sm:h-96 object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
              onClick={() =>
                onOpenLightbox(
                  clinicImages.reception,
                  'Dr. Ashwini\'s Smile Zone Reception',
                  'Warm, tranquil patient waiting lounge in Gokulam 1st Stage, Mysuru.'
                )
              }
            />
            <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">Dr. Ashwini's Smile Zone</span>
              <span className="text-teal-700 font-semibold">Gokulam 1st Stage, Mysuru</span>
            </div>
          </div>
        </div>
      </div>

      {/* Qualifications & Credentials */}
      <div className="bg-slate-50 rounded-3xl border border-slate-200 p-8 sm:p-12 space-y-8">
        <div className="max-w-2xl">
          <span className="text-xs font-bold text-teal-800 uppercase tracking-wider bg-teal-100/70 px-3 py-1 rounded-full">
            Clinical Credentials
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            Qualifications & Expertise
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Grounded in rigorous academic training and ongoing clinical masterclasses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-teal-700" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">BDS, MDS (Prosthodontics)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Post-graduate specialization in Prosthodontics and Maxillofacial Prosthetics, the dental discipline dedicated to cosmetic and structural tooth replacement.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Award className="w-5 h-5 text-emerald-700" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">25+ Years Dedicated Practice</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Serving generations of families in Mysuru with honest advice, conservative treatment planning, and meticulous surgical precision.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-indigo-700" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Modern Technology</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Intraoral digital scanners, rotary endodontic equipment, digital dental radiography, and hospital-grade multi-stage sterilization autoclaves.
            </p>
          </div>
        </div>
      </div>

      {/* Clinical Team / Specialists */}
      <div className="space-y-6">
        <div>
          <span className="text-xs font-bold text-teal-800 uppercase tracking-wider bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            Our Dental Team
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            Meet the Specialists
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Experienced dental doctors providing multidisciplinary dental care under one roof.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {staffList.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-lg transition"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-800 text-white flex items-center justify-center font-display font-bold text-lg mb-4">
                  {member.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">{member.name}</h3>
                </div>
                <p className="text-xs text-teal-800 font-semibold mt-0.5">{member.role}</p>
                <p className="text-xs text-slate-500 mt-0.5">{member.qualifications}</p>

                <p className="text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100 leading-relaxed">
                  {member.bio}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-400 block font-medium">Core Focus</span>
                <span className="text-xs font-semibold text-slate-800">{member.specialties}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Our Guiding Principles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
            <Heart className="w-5 h-5 text-teal-700" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Gentle, Anxiety-Free Dental Visits</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            We understand dental phobia. Our operatory environment features soft lighting, calming garden greenery, and a reassuring bedside manner that puts anxious adults and young children at complete ease.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-800 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-cyan-700" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Conservative, Honest Dentistry</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            We prioritize preserving your natural tooth structure wherever possible. We only recommend procedures that are genuinely necessary for your health and longevity, always explaining every option beforehand.
          </p>
        </div>
      </div>
    </div>
  );
};
