import React, { useState } from 'react';
import { Calendar, Phone, MapPin, Clock, Menu, X, Shield, Star, User } from 'lucide-react';
import { ClinicSettings } from '../types.ts';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenBooking: (serviceId?: string) => void;
  clinicSettings: ClinicSettings | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenBooking,
  clinicSettings,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'services', label: 'Services & Treatments' },
    { id: 'about', label: 'About Dr. Ashwini' },
    { id: 'gallery', label: 'Clinic Tour' },
    { id: 'contact', label: 'Contact & Location' },
    { id: 'manage', label: 'Manage Booking' },
  ];

  const handleNavClick = (tabId: string) => {
    setCurrentTab(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const phone = clinicSettings?.phone || '+91 98860 98901';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top emergency & information ticker */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-4 text-[11px] sm:text-xs">
            <span className="flex items-center gap-1.5 text-teal-400 font-medium">
              <Star className="w-3.5 h-3.5 fill-teal-400" />
              <span>4.9 / 5.0 (70+ Verified Google Reviews)</span>
            </span>
            <span className="hidden md:inline text-slate-500">•</span>
            <span className="hidden md:flex items-center gap-1 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Gokulam 1st Stage, Mysuru</span>
            </span>
            <span className="hidden lg:inline text-slate-500">•</span>
            <span className="hidden lg:flex items-center gap-1 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Mon - Sat: 9:30 AM - 9:00 PM</span>
            </span>
          </div>

          <div className="flex items-center gap-3 ml-auto text-[11px] sm:text-xs">
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="flex items-center gap-1.5 text-teal-300 hover:text-white font-medium transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{phone}</span>
            </a>
            <button
              onClick={() => handleNavClick('admin')}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-[11px] px-2 py-0.5 rounded bg-slate-800 transition"
              title="Clinic Owner / Staff Login"
            >
              <Shield className="w-3 h-3 text-teal-400" />
              <span>Admin Portal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-3 text-left group focus:outline-hidden"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 text-white flex items-center justify-center shadow-md shadow-teal-900/10 group-hover:scale-105 transition-transform">
            <span className="font-display font-bold text-xl tracking-tight text-teal-200">SZ</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg sm:text-xl text-slate-900 tracking-tight leading-none group-hover:text-teal-800 transition-colors">
                Dr. Ashwini's Smile Zone
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium tracking-wide">
              Advanced Restorative & Implant Dentistry • Mysuru
            </p>
          </div>
        </button>

        {/* Desktop Nav Links */}
        <nav className="hidden xl:flex items-center gap-1 2xl:gap-2">
          {navLinks.map((link) => {
            const isActive = currentTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  isActive
                    ? 'text-teal-900 bg-teal-50/80 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-2.5">
          <button
            onClick={() => handleNavClick('manage')}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-teal-900 hover:bg-slate-100 rounded-lg transition border border-slate-200"
          >
            <User className="w-3.5 h-3.5 text-teal-700" />
            <span>My Booking</span>
          </button>

          <button
            onClick={() => onOpenBooking()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg shadow-md shadow-teal-900/15 hover:shadow-lg hover:shadow-teal-900/25 active:scale-[0.98] transition-all"
          >
            <Calendar className="w-4 h-4 text-teal-200" />
            <span>Book Appointment</span>
          </button>
        </div>

        {/* Mobile Menu Hamburger */}
        <div className="flex items-center gap-2 xl:hidden">
          <button
            onClick={() => onOpenBooking()}
            className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-800 rounded-lg"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-teal-50 text-teal-900 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{link.label}</span>
                </button>
              );
            })}
            <button
              onClick={() => handleNavClick('admin')}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
            >
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-600" />
                <span>Admin & Staff Portal</span>
              </span>
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2.5">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-teal-800 rounded-lg shadow-sm"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment Online</span>
            </button>
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              <Phone className="w-4 h-4 text-teal-700" />
              <span>Call Clinic: {phone}</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
