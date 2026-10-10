import React, { useState } from 'react';
import {
  Clock,
  CheckCircle,
  Calendar,
  Sparkles,
  Search,
  ShieldCheck,
  ChevronDown,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { Service } from '../types.ts';

interface ServicesPageProps {
  services: Service[];
  onOpenBooking: (serviceId?: string) => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ services, onOpenBooking }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const categories = ['all', ...Array.from(new Set(services.map((s) => s.category)))];

  const filteredServices = services.filter((s) => {
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const faqs = [
    {
      q: 'What should I expect during my first visit consultation?',
      a: 'During your initial appointment, Dr. Ashwini conducts a comprehensive examination of your teeth, gums, and bite, supported by digital intraoral radiography if required. You will receive a clear diagnosis, treatment roadmap, estimated timeframe, and transparent cost breakdown.',
    },
    {
      q: 'Is a single-sitting root canal really painless?',
      a: 'Yes. Modern endodontics has evolved tremendously. At Dr. Ashwini\'s Smile Zone, we use precision computer-guided rotary motors, apex locators, and painless local anesthesia to thoroughly clean and seal infected canals in a single comfortable appointment with zero distress.',
    },
    {
      q: 'How long do dental implants last?',
      a: 'When placed by a trained Prosthodontist and maintained with good oral hygiene, modern titanium and zirconia dental implants can last a lifetime. They integrate directly into the jawbone, preserving bone density and adjacent tooth structure.',
    },
    {
      q: 'What is the advantage of CAD/CAM Zirconia Crowns over traditional metal-ceramic caps?',
      a: 'Zirconia is biocompatible, exceptionally durable, and possesses natural translucency that mimics real enamel. Unlike older metal-ceramic crowns, zirconia eliminates black gum lines and provides high resistance to chipping.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold text-teal-800 uppercase tracking-wider bg-teal-50 px-3.5 py-1.5 rounded-full border border-teal-200">
          Clinical Treatments & Transparent Fees
        </span>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900">
          Specialized Dental Services
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Supervised by Senior Prosthodontist Dr. Ashwini Budanur (25+ years experience). Every procedure is performed with hospital-grade sterilization and gentle precision.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search treatments (e.g. root canal, implants)..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 outline-hidden"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{filteredServices.length}</strong> active treatments
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                selectedCategory === cat
                  ? 'bg-teal-800 text-white shadow-xs font-semibold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Treatments' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-xl hover:border-teal-700/40 transition group"
          >
            <div>
              {/* Badge & Category */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                  {service.category}
                </span>
                {service.badge && (
                  <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                    {service.badge}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="font-display font-bold text-lg text-slate-900 group-hover:text-teal-900 transition-colors">
                {service.name}
              </h3>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed">
                {service.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
              {/* Duration and Fee */}
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <Clock className="w-3.5 h-3.5 text-teal-700" />
                  <span>Duration: {service.duration_minutes} mins</span>
                </span>
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Available</span>
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Treatment Fee
                  </span>
                  <span className="font-bold text-base text-slate-900">{service.price_display}</span>
                </div>

                <button
                  onClick={() => onOpenBooking(service.id)}
                  className="px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold shadow-md active:scale-95 transition flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-teal-200" />
                  <span>Book Slot</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <p className="text-slate-600 text-sm font-medium">No treatments matched your search criteria.</p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="mt-3 px-4 py-2 rounded-lg bg-teal-800 text-white text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Treatment FAQ */}
      <div className="bg-slate-50 rounded-3xl border border-slate-200 p-8 sm:p-12 space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold text-teal-800 uppercase tracking-wider bg-teal-100/70 px-3 py-1 rounded-full">
            Patient Guide
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Common questions regarding appointments, consultations, and dental care in Mysuru.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-semibold text-slate-900 text-sm hover:text-teal-900 transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-teal-700' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
