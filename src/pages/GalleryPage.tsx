import React, { useState } from 'react';
import { ZoomIn, Sparkles, ShieldCheck, Heart } from 'lucide-react';
import { clinicImages } from '../assets/images/index.ts';

interface GalleryPageProps {
  onOpenLightbox: (imgUrl: string, title: string, desc: string) => void;
  onOpenBooking: () => void;
}

export const GalleryPage: React.FC<GalleryPageProps> = ({ onOpenLightbox, onOpenBooking }) => {
  const [filter, setFilter] = useState<string>('all');

  const galleryItems = [
    {
      id: 'reception',
      category: 'clinic',
      image: clinicImages.reception,
      title: 'Patient Reception & Waiting Lounge',
      description: 'Tranquil ambiance with warm oak wood finishes, indoor plants, and comfortable seating in Gokulam 1st Stage.',
      alt: "Dr. Ashwini's Smile Zone Dental Clinic Reception and Waiting Lounge in Gokulam, Mysuru",
    },
    {
      id: 'operatory',
      category: 'operatory',
      image: clinicImages.operatory,
      title: 'Advanced Dental Operatory Suite',
      description: 'High-precision ergonomic dental chair, natural daylight garden views, and sterilized instrumentation.',
      alt: "Dental Operatory Room with Ergonomic Patient Chair at Dr. Ashwini's Smile Zone Mysuru",
    },
    {
      id: 'technology',
      category: 'technology',
      image: clinicImages.technology,
      title: 'Digital 3D Intraoral Scanning & CAD/CAM Studio',
      description: 'Digital 3D scanner wand and tablet model for precision dental crowns, veneers, and invisible aligners.',
      alt: 'Digital Intraoral 3D Scanner for Dental Crowns and Clear Aligners',
    },
    {
      id: 'sterilization',
      category: 'hygiene',
      image: clinicImages.sterilization,
      title: 'Hospital-Grade Autoclave Sterilization Suite',
      description: 'Multi-stage Class B autoclaves, vacuum sealing, and surgical sterilization to prevent cross-contamination.',
      alt: 'Hospital-Grade Autoclave Sterilization Room at Dr. Ashwini Dental Clinic',
    },
  ];

  const filteredItems = galleryItems.filter((item) => filter === 'all' || item.category === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold text-teal-800 uppercase tracking-wider bg-teal-50 px-3.5 py-1.5 rounded-full border border-teal-200">
          Clinic Visual Tour
        </span>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900">
          Inside Our Dental Care Facility
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Step inside Dr. Ashwini's Smile Zone in Gokulam, Mysuru. Designed with calming interiors, advanced digital equipment, and immaculate sterilization standards.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-center flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            filter === 'all' ? 'bg-teal-800 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          All Areas
        </button>
        <button
          onClick={() => setFilter('clinic')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            filter === 'clinic' ? 'bg-teal-800 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Lounge & Reception
        </button>
        <button
          onClick={() => setFilter('operatory')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            filter === 'operatory' ? 'bg-teal-800 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Operatory Suites
        </button>
        <button
          onClick={() => setFilter('technology')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            filter === 'technology' ? 'bg-teal-800 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          3D Digital Studio
        </button>
        <button
          onClick={() => setFilter('hygiene')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            filter === 'hygiene' ? 'bg-teal-800 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Sterilization & Hygiene
        </button>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => onOpenLightbox(item.image, item.title, item.description)}
            className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div className="relative overflow-hidden aspect-video">
              <img
                src={item.image}
                alt={item.alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/90 text-slate-900 text-xs font-bold shadow-lg">
                  <ZoomIn className="w-4 h-4 text-teal-800" />
                  <span>Enlarge Photo</span>
                </span>
              </div>
            </div>

            <div className="p-5 sm:p-6 bg-white space-y-2">
              <h3 className="font-display font-bold text-lg text-slate-900 group-hover:text-teal-900 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Booking CTA Bar */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 rounded-3xl p-8 sm:p-10 text-white text-center space-y-4 shadow-xl">
        <h3 className="font-display text-2xl font-bold">Experience Our Clinic in Person</h3>
        <p className="text-xs sm:text-sm text-teal-200 max-w-xl mx-auto">
          Located at No 24, 3rd Cross, Gokulam Main Road, Gokulam 1st Stage, Mysuru. We invite you to visit for a consultation.
        </p>
        <div className="pt-2">
          <button
            onClick={onOpenBooking}
            className="px-6 py-3 rounded-xl bg-white text-slate-900 font-bold text-xs sm:text-sm hover:bg-teal-50 transition shadow-md"
          >
            Book Your Consultation
          </button>
        </div>
      </div>
    </div>
  );
};
