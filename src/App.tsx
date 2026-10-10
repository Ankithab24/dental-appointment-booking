import React, { useState, useEffect } from 'react';
import { ClinicSettings, Service, StaffMember, Review } from './types.ts';
import { fetchClinicSettings, fetchServices, fetchStaff, fetchReviews } from './api.ts';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { ServicesPage } from './pages/ServicesPage.tsx';
import { AboutPage } from './pages/AboutPage.tsx';
import { GalleryPage } from './pages/GalleryPage.tsx';
import { ContactPage } from './pages/ContactPage.tsx';
import { ManageBookingPage } from './pages/ManageBookingPage.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';
import { BookingWizard } from './components/BookingWizard.tsx';
import { ImageLightbox } from './components/ImageLightbox.tsx';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Booking Wizard Modal / Overlay
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [bookingServiceId, setBookingServiceId] = useState<string | undefined>(undefined);

  // Manage booking direct parameters
  const [lookupRef, setLookupRef] = useState<string>('');
  const [lookupPhone, setLookupPhone] = useState<string>('');

  // Lightbox state
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    imageUrl: string;
    title: string;
    description: string;
  }>({
    isOpen: false,
    imageUrl: '',
    title: '',
    description: '',
  });

  // Load clinic information on start
  const refreshClinicData = async () => {
    try {
      const [settingsData, servicesData, staffData, reviewsData] = await Promise.all([
        fetchClinicSettings(),
        fetchServices(false),
        fetchStaff(),
        fetchReviews(),
      ]);
      setClinicSettings(settingsData);
      setServices(servicesData);
      setStaffList(staffData);
      setReviews(reviewsData);
    } catch (err) {
      console.error('Failed to load clinic settings', err);
    }
  };

  useEffect(() => {
    refreshClinicData();
  }, []);

  const handleOpenBooking = (serviceId?: string) => {
    setBookingServiceId(serviceId);
    setIsBookingModalOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenLightbox = (imageUrl: string, title: string, description: string) => {
    setLightbox({
      isOpen: true,
      imageUrl,
      title,
      description,
    });
  };

  const handleViewBooking = (reference: string, phone: string) => {
    setIsBookingModalOpen(false);
    setLookupRef(reference);
    setLookupPhone(phone);
    setCurrentTab('manage');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased selection:bg-teal-700 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenBooking={() => handleOpenBooking()}
        clinicSettings={clinicSettings}
      />

      {/* Main Page Content */}
      <main className="flex-1">
        {/* If booking modal is open as standalone top view or modal */}
        {isBookingModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 flex items-start justify-center animate-in fade-in duration-150">
            <div className="w-full max-w-4xl my-4 sm:my-8">
              <BookingWizard
                initialServiceId={bookingServiceId}
                clinicSettings={clinicSettings}
                onClose={() => setIsBookingModalOpen(false)}
                onViewBooking={handleViewBooking}
              />
            </div>
          </div>
        )}

        {/* Tab Routing */}
        {currentTab === 'home' && (
          <HomePage
            clinicSettings={clinicSettings}
            services={services}
            reviews={reviews}
            onOpenBooking={handleOpenBooking}
            onNavigate={(tab) => {
              setCurrentTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenLightbox={handleOpenLightbox}
          />
        )}

        {currentTab === 'services' && (
          <ServicesPage
            services={services}
            onOpenBooking={handleOpenBooking}
          />
        )}

        {currentTab === 'about' && (
          <AboutPage
            clinicSettings={clinicSettings}
            staffList={staffList}
            onOpenBooking={() => handleOpenBooking()}
            onOpenLightbox={handleOpenLightbox}
          />
        )}

        {currentTab === 'gallery' && (
          <GalleryPage
            onOpenLightbox={handleOpenLightbox}
            onOpenBooking={() => handleOpenBooking()}
          />
        )}

        {currentTab === 'contact' && (
          <ContactPage
            clinicSettings={clinicSettings}
            onOpenBooking={() => handleOpenBooking()}
          />
        )}

        {currentTab === 'manage' && (
          <ManageBookingPage
            initialReference={lookupRef}
            initialPhone={lookupPhone}
            clinicSettings={clinicSettings}
            onOpenNewBooking={() => handleOpenBooking()}
          />
        )}

        {currentTab === 'admin' && (
          <AdminDashboard
            clinicSettings={clinicSettings}
            onRefreshClinicSettings={refreshClinicData}
          />
        )}
      </main>

      {/* Image Lightbox */}
      <ImageLightbox
        isOpen={lightbox.isOpen}
        imageUrl={lightbox.imageUrl}
        title={lightbox.title}
        description={lightbox.description}
        onClose={() => setLightbox((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Footer */}
      <Footer
        onNavigate={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        clinicSettings={clinicSettings}
      />
    </div>
  );
}
