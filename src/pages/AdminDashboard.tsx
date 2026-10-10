import React, { useState, useEffect } from 'react';
import {
  Shield,
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Plus,
  Edit2,
  Trash2,
  Lock,
  LogOut,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Mail,
  RefreshCw,
  Eye,
  FileText,
  Database,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { Appointment, Service, ClinicSettings, ContactInquiry } from '../types.ts';
import {
  adminLogin,
  adminVerify,
  getAdminStats,
  getAdminAppointments,
  updateAppointmentStatus,
  adminSaveService,
  adminSaveSettings,
  adminChangePassword,
  adminGetInquiries,
  adminToggleInquiryResolved,
  fetchServices,
  bookAppointment,
  getSupabaseStatus,
  syncAllToSupabase,
  SupabaseStatusInfo
} from '../api.ts';

interface AdminDashboardProps {
  clinicSettings: ClinicSettings | null;
  onRefreshClinicSettings: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  clinicSettings,
  onRefreshClinicSettings,
}) => {
  // Auth state
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('asz_admin_token'));
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Active tab in admin
  const [activeTab, setActiveTab] = useState<'appointments' | 'services' | 'settings' | 'inquiries' | 'supabase'>('appointments');

  // Supabase Integration State
  const [supabaseInfo, setSupabaseInfo] = useState<SupabaseStatusInfo | null>(null);
  const [syncingSupabase, setSyncingSupabase] = useState(false);
  const [supabaseSyncMessage, setSupabaseSyncMessage] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);

  // Stats
  const [stats, setStats] = useState<any>({
    todayCount: 0,
    upcomingCount: 0,
    totalCount: 0,
    cancelledCount: 0,
    completedCount: 0,
    inquiriesCount: 0,
  });

  // Appointments
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [loadingAppts, setLoadingAppts] = useState<boolean>(false);

  // Services
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  const [showServiceModal, setShowServiceModal] = useState<boolean>(false);

  // Settings
  const [settingsForm, setSettingsForm] = useState<any>(clinicSettings || {});
  const [settingsStatus, setSettingsStatus] = useState<string>('');

  // Password change
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwStatus, setPwStatus] = useState('');

  // Inquiries
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);

  // Manual Walk-in Booking Modal
  const [showManualBookingModal, setShowManualBookingModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    serviceId: '',
    customerName: '',
    customerPhone: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    notes: 'Walk-in / Phone appointment booked by front desk',
  });
  const [manualBookingError, setManualBookingError] = useState('');

  // 1. Check existing token on mount
  useEffect(() => {
    if (token) {
      adminVerify(token).catch(() => {
        setToken(null);
        localStorage.removeItem('asz_admin_token');
      });
    }
  }, [token]);

  // 2. Load admin data whenever token is valid or tab changes
  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token, activeTab, filterDate, filterStatus, searchKeyword]);

  const loadDashboardData = async () => {
    if (!token) return;
    try {
      setLoadingAppts(true);
      const [sData, aData] = await Promise.all([
        getAdminStats(token),
        getAdminAppointments(token, {
          date: filterDate || undefined,
          status: filterStatus !== 'all' ? filterStatus : undefined,
          search: searchKeyword || undefined,
        }),
      ]);
      setStats(sData);
      setAppointments(aData);

      if (activeTab === 'services') {
        const srv = await fetchServices(true);
        setServicesList(srv);
      } else if (activeTab === 'inquiries') {
        const inq = await adminGetInquiries(token);
        setInquiries(inq);
      } else if (activeTab === 'supabase') {
        const sInfo = await getSupabaseStatus(token);
        setSupabaseInfo(sInfo);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingAppts(false);
    }
  };

  const handleSyncAllToSupabase = async () => {
    if (!token) return;
    setSyncingSupabase(true);
    setSupabaseSyncMessage('Syncing all appointments to Supabase...');
    try {
      const res = await syncAllToSupabase(token);
      if (res.failedCount === 0) {
        setSupabaseSyncMessage(`Successfully synced ${res.syncedCount} of ${res.totalAttempted} appointments to Supabase!`);
      } else {
        setSupabaseSyncMessage(
          `Synced: ${res.syncedCount}, Pending/Failed: ${res.failedCount}. ${res.errors[0] || ''}`
        );
      }
      const sInfo = await getSupabaseStatus(token);
      setSupabaseInfo(sInfo);
    } catch (err: any) {
      setSupabaseSyncMessage('Sync error: ' + (err.message || 'Check connection'));
    } finally {
      setSyncingSupabase(false);
    }
  };

  const handleCopySql = (sqlText: string) => {
    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await adminLogin(username.trim(), password.trim());
      setToken(res.token);
      localStorage.setItem('asz_admin_token', res.token);
      setPassword('');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('asz_admin_token');
  };

  // Appointment Status Change
  const handleUpdateStatus = async (id: number, newStatus: string) => {
    if (!token) return;
    try {
      await updateAppointmentStatus(token, id, newStatus);
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  // Save Service
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingService) return;
    try {
      await adminSaveService(token, editingService, Boolean(editingService.id && editingService.sort_order));
      setShowServiceModal(false);
      setEditingService(null);
      const updated = await fetchServices(true);
      setServicesList(updated);
    } catch (err: any) {
      alert(err.message || 'Error saving service');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      setSettingsStatus('Saving changes...');
      await adminSaveSettings(token, settingsForm);
      setSettingsStatus('Settings successfully updated!');
      onRefreshClinicSettings();
      setTimeout(() => setSettingsStatus(''), 3000);
    } catch (err: any) {
      setSettingsStatus('Error: ' + err.message);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      setPwStatus('Updating password...');
      await adminChangePassword(token, currentPw, newPw);
      setPwStatus('Password changed successfully!');
      setCurrentPw('');
      setNewPw('');
      setTimeout(() => setPwStatus(''), 3000);
    } catch (err: any) {
      setPwStatus('Error: ' + err.message);
    }
  };

  // Handle Manual Booking
  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualBookingError('');
    try {
      await bookAppointment({
        serviceId: manualForm.serviceId || (servicesList[0]?.id ?? 'oral-consultation'),
        customerName: manualForm.customerName,
        customerPhone: manualForm.customerPhone,
        appointmentDate: manualForm.appointmentDate,
        startTime: manualForm.startTime,
        notes: manualForm.notes,
      });
      setShowManualBookingModal(false);
      setManualForm({
        serviceId: '',
        customerName: '',
        customerPhone: '',
        appointmentDate: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        notes: 'Walk-in / Phone appointment booked by front desk',
      });
      loadDashboardData();
    } catch (err: any) {
      setManualBookingError(err.message || 'Slot conflict or validation error');
    }
  };

  // IF NOT LOGGED IN: Show Login Form
  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center mx-auto shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="font-display font-bold text-2xl text-slate-900">Dr. Ashwini's Smile Zone</h2>
            <p className="text-xs text-slate-500">Clinic Administration & Reception Portal</p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-teal-700 outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-teal-700 outline-hidden"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-sm shadow-md transition disabled:opacity-50"
            >
              {loggingIn ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-[11px] text-slate-500">
            Initial default credentials: <strong>admin</strong> / <strong>admin123</strong>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN DASHBOARD
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Top Bar with Logout */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center font-display font-bold text-lg shadow-sm">
            SZ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-lg text-slate-900">Dr. Ashwini's Smile Zone</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md">
                Admin
              </span>
            </div>
            <p className="text-xs text-slate-500">Gokulam 1st Stage • Practice Management System</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchServices(true).then((s) => setServicesList(s));
              setShowManualBookingModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-teal-200" />
            <span>Manual Appointment</span>
          </button>

          <button
            onClick={loadDashboardData}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Today's Visits</span>
          <span className="text-2xl font-bold text-teal-900 mt-1 block">{stats.todayCount}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Upcoming</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{stats.upcomingCount}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Booked</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{stats.totalCount}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Completed</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">{stats.completedCount}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Cancelled</span>
          <span className="text-2xl font-bold text-rose-600 mt-1 block">{stats.cancelledCount}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Inquiries</span>
          <span className="text-2xl font-bold text-blue-700 mt-1 block">{stats.inquiriesCount}</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 text-xs sm:text-sm font-semibold gap-2">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`pb-3 px-4 border-b-2 transition ${
            activeTab === 'appointments'
              ? 'border-teal-800 text-teal-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Appointments Calendar & Roster
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`pb-3 px-4 border-b-2 transition ${
            activeTab === 'services'
              ? 'border-teal-800 text-teal-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Treatments & Price Catalog
        </button>

        <button
          onClick={() => setActiveTab('inquiries')}
          className={`pb-3 px-4 border-b-2 transition ${
            activeTab === 'inquiries'
              ? 'border-teal-800 text-teal-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Inquiries Inbox ({stats.inquiriesCount})
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-4 border-b-2 transition ${
            activeTab === 'settings'
              ? 'border-teal-800 text-teal-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Clinic Rules & Password
        </button>

        <button
          onClick={() => {
            setActiveTab('supabase');
            if (token) {
              getSupabaseStatus(token).then(setSupabaseInfo).catch(() => {});
            }
          }}
          className={`pb-3 px-4 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'supabase'
              ? 'border-emerald-600 text-emerald-800 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span>Supabase Backend</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </button>
      </div>

      {/* TAB 1: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Filter by Date</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white outline-hidden"
                >
                  <option value="all">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Search Patient / Ref</label>
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Name, phone, or reference..."
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs w-48 outline-hidden"
                />
              </div>
            </div>

            {(filterDate || filterStatus !== 'all' || searchKeyword) && (
              <button
                onClick={() => {
                  setFilterDate('');
                  setFilterStatus('all');
                  setSearchKeyword('');
                }}
                className="text-teal-700 hover:underline font-semibold"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Appointments Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Reference</th>
                    <th className="px-4 py-3.5">Schedule</th>
                    <th className="px-4 py-3.5">Patient Details</th>
                    <th className="px-4 py-3.5">Treatment & Fee</th>
                    <th className="px-4 py-3.5">Doctor</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-mono font-bold text-teal-900">{a.booking_reference}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{a.appointment_date}</div>
                        <div className="text-slate-500 text-[11px]">
                          {a.start_time} - {a.end_time}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{a.customer_name}</div>
                        <a href={`tel:${a.customer_phone}`} className="text-teal-800 hover:underline text-[11px]">
                          {a.customer_phone}
                        </a>
                        {a.notes && <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{a.notes}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{a.service_name}</div>
                        <div className="text-slate-500 text-[11px]">{a.price_display}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{a.staff_name || 'Dr. Ashwini'}</td>
                      <td className="px-4 py-3">
                        {a.status === 'confirmed' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[10px]">
                            Confirmed
                          </span>
                        )}
                        {a.status === 'completed' && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-[10px]">
                            Completed
                          </span>
                        )}
                        {a.status === 'cancelled' && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-[10px]">
                            Cancelled
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {a.status === 'confirmed' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(a.id, 'completed')}
                                className="px-2 py-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold text-[10px]"
                                title="Mark as Completed"
                              >
                                Complete
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(a.id, 'cancelled')}
                                className="px-2 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 font-semibold text-[10px]"
                                title="Cancel Booking"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {a.status === 'cancelled' && (
                            <button
                              onClick={() => handleUpdateStatus(a.id, 'confirmed')}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px]"
                            >
                              Reopen
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {appointments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        No appointments found matching current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SERVICES MANAGEMENT */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-display font-bold text-lg text-slate-900">Manage Clinic Services & Pricing</h2>
            <button
              onClick={() => {
                setEditingService({
                  name: '',
                  category: 'Prosthodontics & Implants',
                  description: '',
                  duration_minutes: 30,
                  price_display: '₹',
                  is_active: 1,
                  badge: '',
                });
                setShowServiceModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Service</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {servicesList.map((srv) => (
              <div key={srv.id} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {srv.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      srv.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {srv.is_active ? 'Active' : 'Hidden'}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900">{srv.name}</h3>
                <p className="text-xs text-slate-600 line-clamp-2">{srv.description}</p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">{srv.duration_minutes} mins</span>
                  <span className="font-bold text-slate-900">{srv.price_display}</span>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      setEditingService(srv);
                      setShowServiceModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: INQUIRIES INBOX */}
      {activeTab === 'inquiries' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-display font-bold text-base text-slate-900">Patient Website Messages</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {inquiries.map((inq) => (
              <div key={inq.id} className="p-5 flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900 text-sm font-semibold">{inq.name}</strong>
                    <span className="text-slate-400">• {new Date(inq.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-teal-800 font-semibold flex items-center gap-3">
                    <a href={`tel:${inq.phone}`}>{inq.phone}</a>
                    {inq.email && <a href={`mailto:${inq.email}`}>{inq.email}</a>}
                  </div>
                  <div className="font-bold text-slate-800 pt-1">{inq.subject}</div>
                  <p className="text-slate-600 leading-relaxed text-xs">{inq.message}</p>
                </div>

                <button
                  onClick={async () => {
                    if (!token) return;
                    await adminToggleInquiryResolved(token, inq.id, !inq.is_resolved);
                    const updated = await adminGetInquiries(token);
                    setInquiries(updated);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                    inq.is_resolved
                      ? 'bg-slate-100 text-slate-500'
                      : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  }`}
                >
                  {inq.is_resolved ? 'Marked Resolved' : 'Mark as Resolved'}
                </button>
              </div>
            ))}
            {inquiries.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-xs">No customer messages received yet.</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SETTINGS & PASSWORD */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900">Clinic Working Rules & Information</h2>
              <p className="text-xs text-slate-500">Edit business details, lead times, and cancellation policy.</p>
            </div>

            {settingsStatus && (
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs">
                {settingsStatus}
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Clinic Name</label>
                  <input
                    type="text"
                    value={settingsForm.business_name || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, business_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lead Specialist Name</label>
                  <input
                    type="text"
                    value={settingsForm.lead_doctor || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, lead_doctor: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={settingsForm.phone || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Secondary Phone</label>
                  <input
                    type="text"
                    value={settingsForm.secondary_phone || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, secondary_phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Opening Time (24h)</label>
                  <input
                    type="time"
                    value={settingsForm.opening_time || '09:30'}
                    onChange={(e) => setSettingsForm({ ...settingsForm, opening_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Closing Time (24h)</label>
                  <input
                    type="time"
                    value={settingsForm.closing_time || '21:00'}
                    onChange={(e) => setSettingsForm({ ...settingsForm, closing_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Advance Booking Lead Time (Hours)</label>
                  <input
                    type="number"
                    value={settingsForm.lead_time_hours || 2}
                    onChange={(e) => setSettingsForm({ ...settingsForm, lead_time_hours: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cancellation Notice Required (Hours)</label>
                  <input
                    type="number"
                    value={settingsForm.cancellation_notice_hours || 4}
                    onChange={(e) => setSettingsForm({ ...settingsForm, cancellation_notice_hours: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cancellation Policy Display Text</label>
                <textarea
                  rows={2}
                  value={settingsForm.cancellation_policy || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, cancellation_policy: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs shadow-xs"
              >
                Save Clinic Settings
              </button>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">Change Admin Password</h3>
              <p className="text-[11px] text-slate-500">Update your secure login key.</p>
            </div>

            {pwStatus && <div className="p-2.5 rounded-lg bg-teal-50 text-teal-800 text-[11px]">{pwStatus}</div>}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: SUPABASE CLOUD DATABASE INTEGRATION */}
      {activeTab === 'supabase' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shadow-xs">
                  <Database className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display font-bold text-xl text-slate-900">Supabase Backend Integration</h2>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      <span>Connected</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Whenever an appointment is booked or updated, it is synchronized with your Supabase database.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={async () => {
                    if (!token) return;
                    setLoadingAppts(true);
                    const info = await getSupabaseStatus(token);
                    setSupabaseInfo(info);
                    setLoadingAppts(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Status</span>
                </button>

                <a
                  href={`https://supabase.com/dashboard/project/${supabaseInfo?.projectId || 'zimolpwlvuilckylzkwl'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                >
                  <span>Open Supabase Dashboard</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Sync Feedback Message */}
            {supabaseSyncMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                <span>{supabaseSyncMessage}</span>
                <button onClick={() => setSupabaseSyncMessage('')} className="text-emerald-700 font-bold ml-2">
                  ✕
                </button>
              </div>
            )}

            {/* Connection Parameters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Project ID</span>
                <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                  {supabaseInfo?.projectId || 'zimolpwlvuilckylzkwl'}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">Configured in app backend</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Database URL</span>
                <span className="font-mono text-xs text-slate-800 mt-0.5 block truncate">
                  {supabaseInfo?.url || 'https://zimolpwlvuilckylzkwl.supabase.co'}
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">Active API Endpoint</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Sync Summary</span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-semibold text-emerald-700">
                    Synced: {supabaseInfo?.totalSyncedCount ?? 0}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-700">
                    Pending/Total: {supabaseInfo?.totalPendingCount ?? 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Table Existence Alert & Instructions */}
            {supabaseInfo?.tableExists ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-xs text-emerald-900">
                <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-emerald-950">Table 'public.appointments' is Live in Supabase!</h4>
                  <p className="mt-0.5 text-emerald-800">
                    Your Supabase schema is verified. Every appointment submitted on this website will automatically insert/update into your Supabase database table.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 space-y-3 text-xs text-amber-950">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-amber-950">Setup Step: Create 'appointments' Table in Supabase</h4>
                    <p className="mt-1 text-amber-900 leading-relaxed">
                      Your Supabase credentials are connected! To start storing appointments in Supabase, run the one-click SQL schema below in your Supabase SQL Editor.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <a
                    href={`https://supabase.com/dashboard/project/${supabaseInfo?.projectId || 'zimolpwlvuilckylzkwl'}/sql/new`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-lg bg-amber-800 hover:bg-amber-900 text-white font-semibold flex items-center gap-1.5 transition"
                  >
                    <span>1. Open Supabase SQL Editor</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => handleCopySql(supabaseInfo?.setupSql || '')}
                    className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-800 font-semibold border border-slate-300 flex items-center gap-1.5 transition"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied SQL to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>2. Copy SQL Script</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={async () => {
                      if (!token) return;
                      const info = await getSupabaseStatus(token);
                      setSupabaseInfo(info);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
                  >
                    3. Check Table Again
                  </button>
                </div>
              </div>
            )}

            {/* Manual Sync All Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <h4 className="font-bold text-sm text-slate-900">Sync All Past & Existing Bookings</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Push all existing appointments from the clinic database to Supabase now.
                </p>
              </div>

              <button
                onClick={handleSyncAllToSupabase}
                disabled={syncingSupabase}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition flex items-center gap-2 disabled:opacity-50"
              >
                {syncingSupabase ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synchronizing...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span>Sync All Bookings to Supabase</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* SQL Editor Code Snippet */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Supabase SQL Table Schema & Row Level Security (RLS)</h3>
                <p className="text-xs text-slate-500">Run this once in Supabase SQL editor to create the appointments and inquiries tables.</p>
              </div>

              <button
                onClick={() => handleCopySql(supabaseInfo?.setupSql || '')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SQL</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-64 leading-relaxed">
              {supabaseInfo?.setupSql || '-- Loading SQL script...'}
            </pre>
          </div>
        </div>
      )}

      {/* Manual Walk-in Booking Modal */}
      {showManualBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Book Walk-in / Phone Appointment</h3>
              <button onClick={() => setShowManualBookingModal(false)} className="text-slate-400">
                ✕
              </button>
            </div>

            {manualBookingError && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-800 text-xs">{manualBookingError}</div>
            )}

            <form onSubmit={handleCreateManualBooking} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Treatment</label>
                <select
                  value={manualForm.serviceId}
                  onChange={(e) => setManualForm({ ...manualForm, serviceId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  {servicesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.duration_minutes}m - {s.price_display})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient Full Name</label>
                <input
                  type="text"
                  value={manualForm.customerName}
                  onChange={(e) => setManualForm({ ...manualForm, customerName: e.target.value })}
                  placeholder="e.g. Ramesh"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile Phone Number</label>
                <input
                  type="tel"
                  value={manualForm.customerPhone}
                  onChange={(e) => setManualForm({ ...manualForm, customerPhone: e.target.value })}
                  placeholder="+91 98860 98901"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={manualForm.appointmentDate}
                    onChange={(e) => setManualForm({ ...manualForm, appointmentDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={manualForm.startTime}
                    onChange={(e) => setManualForm({ ...manualForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Internal Notes</label>
                <input
                  type="text"
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowManualBookingModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold shadow-xs"
                >
                  Save Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showServiceModal && editingService && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingService.id ? 'Edit Service' : 'Add New Dental Service'}
              </h3>
              <button onClick={() => setShowServiceModal(false)} className="text-slate-400">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Service Title</label>
                <input
                  type="text"
                  value={editingService.name || ''}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  value={editingService.category || ''}
                  onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Description</label>
                <textarea
                  rows={3}
                  value={editingService.description || ''}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={editingService.duration_minutes || 30}
                    onChange={(e) =>
                      setEditingService({ ...editingService, duration_minutes: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price Display</label>
                  <input
                    type="text"
                    value={editingService.price_display || ''}
                    onChange={(e) => setEditingService({ ...editingService, price_display: e.target.value })}
                    placeholder="e.g. From ₹4,500"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(editingService.is_active)}
                    onChange={(e) => setEditingService({ ...editingService, is_active: e.target.checked ? 1 : 0 })}
                    className="rounded text-teal-700"
                  />
                  <span>Active in Public Booking</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold shadow-xs"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
