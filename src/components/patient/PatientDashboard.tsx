import React, { useState, useEffect } from 'react';
import { 
  User, 
  Hospital, 
  Ward, 
  Bed, 
  Doctor, 
  StaffRoster, 
  Token, 
  DoctorStatus,
  WardType 
} from '../../types';
import { realtimeSync } from '../../services/realtimeSync';
import { 
  Building2, 
  HeartPulse, 
  PhoneCall, 
  Users, 
  Activity, 
  Bed as BedIcon, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  QrCode, 
  Calendar, 
  MapPin, 
  ShieldAlert, 
  Stethoscope, 
  ChevronRight, 
  Search, 
  Sparkles, 
  Bell, 
  Info,
  ArrowUpRight,
  Flame,
  Volume2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

interface PatientDashboardProps {
  currentUser: User;
  onSwitchToAdmin: () => void;
  onLogout: () => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  currentUser,
  onSwitchToAdmin,
  onLogout,
}) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('hosp-aiims-delhi');
  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [roster, setRoster] = useState<StaffRoster | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);

  // Filters & Tabs
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [wardFilter, setWardFilter] = useState<WardType | 'ALL'>('ALL');
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<Doctor | null>(null);
  const [bookingPriority, setBookingPriority] = useState<'NORMAL' | 'SENIOR_CITIZEN' | 'EMERGENCY'>('NORMAL');
  const [symptomsInput, setSymptomsInput] = useState('');
  const [activeTokenNotification, setActiveTokenNotification] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Sync data from realtime engine
  const refreshData = () => {
    setHospitals(realtimeSync.getHospitals());
    setWards(realtimeSync.getWards(selectedHospitalId));
    setBeds(realtimeSync.getBeds(selectedHospitalId));
    setDoctors(realtimeSync.getDoctors(selectedHospitalId));
    setRoster(realtimeSync.getStaffRoster(selectedHospitalId));
    setTokens(realtimeSync.getTokens(selectedHospitalId));
  };

  useEffect(() => {
    refreshData();

    // Subscribe to multi-device real-time sync
    const unsubscribe = realtimeSync.subscribe((event) => {
      refreshData();

      if (event.type === 'TOKEN_CALLED') {
        const calledToken = event.payload.calledToken as Token | null;
        if (calledToken && (calledToken.patientId === currentUser.id || calledToken.patientName === currentUser.name)) {
          setActiveTokenNotification(`🚨 YOUR TOKEN IS NOW CALLED: Token #${calledToken.tokenNumber} in ${calledToken.roomNumber}!`);
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        }
      }
      if (event.type === 'BED_STATUS_CHANGED') {
        // subtle highlight update
      }
    });

    return () => unsubscribe();
  }, [selectedHospitalId, currentUser.id, currentUser.name]);

  const currentHospital = hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0];

  // Helper for ward capacity styling
  const getCapacityMeta = (available: number, total: number) => {
    const ratio = total > 0 ? (available / total) * 100 : 0;
    if (ratio >= 30) {
      return {
        level: 'AVAILABLE',
        label: 'Available',
        badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        progressClass: 'bg-emerald-500',
        icon: CheckCircle2,
      };
    } else if (ratio >= 10) {
      return {
        level: 'FILLING_FAST',
        label: 'Filling Fast',
        badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        progressClass: 'bg-amber-500',
        icon: AlertCircle,
      };
    } else {
      return {
        level: 'FULL',
        label: 'Critical / Full',
        badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        progressClass: 'bg-rose-500',
        icon: ShieldAlert,
      };
    }
  };

  // Helper for doctor status badge
  const getDoctorStatusMeta = (status: DoctorStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return {
          label: 'Available in OPD',
          bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          dot: 'bg-emerald-400 animate-pulse',
        };
      case 'IN_CONSULTATION':
        return {
          label: 'In Consultation',
          bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          dot: 'bg-amber-400',
        };
      case 'IN_SURGERY':
        return {
          label: 'In Emergency Surgery',
          bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          dot: 'bg-rose-400',
        };
      case 'OFF_DUTY':
        return {
          label: 'Off Duty',
          bg: 'bg-slate-700/40 text-slate-400 border-slate-700',
          dot: 'bg-slate-500',
        };
    }
  };

  // User's own tokens
  const myTokens = tokens.filter(
    (t) => t.patientId === currentUser.id || t.patientName === currentUser.name
  );

  const handleOpenBooking = (doctor: Doctor) => {
    setSelectedDoctorForBooking(doctor);
    setIsTokenModalOpen(true);
  };

  const handleConfirmToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorForBooking || !currentHospital) return;

    setIsGenerating(true);
    setTimeout(() => {
      const generated = realtimeSync.generateToken({
        hospitalId: currentHospital.id,
        hospitalName: currentHospital.name,
        department: selectedDoctorForBooking.department,
        doctorId: selectedDoctorForBooking.id,
        doctorName: selectedDoctorForBooking.name,
        patientId: currentUser.id,
        patientName: currentUser.name,
        patientPhone: currentUser.phone,
        priority: bookingPriority,
        symptoms: symptomsInput,
      });

      setIsGenerating(false);
      setIsTokenModalOpen(false);
      setSymptomsInput('');

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
      refreshData();
    }, 400);
  };

  const filteredDoctors = doctors.filter((doc) => {
    if (departmentFilter === 'ALL') return true;
    return doc.department.toLowerCase().includes(departmentFilter.toLowerCase());
  });

  const filteredWards = wards.filter((w) => {
    if (wardFilter === 'ALL') return true;
    return w.type === wardFilter;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-16">
      
      {/* Real-time Callout Banner if user's token is called */}
      <AnimatePresence>
        {activeTokenNotification && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 text-slate-950 font-bold px-4 py-3 shadow-xl sticky top-0 z-50 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
              <Volume2 className="w-5 h-5 shrink-0 animate-bounce" />
              <span className="text-sm sm:text-base tracking-tight">{activeTokenNotification}</span>
              <button
                onClick={() => {
                  realtimeSync.playHospitalChime();
                  setActiveTokenNotification(null);
                }}
                className="ml-auto px-3 py-1 bg-slate-950 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 transition"
              >
                Acknowledge
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md px-4 sm:px-8 py-3.5 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-teal-500/20">
              <HeartPulse className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white">Swasthya Setu</span>
                <span className="bg-teal-500/20 text-teal-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-500/30">
                  PATIENT PORTAL
                </span>
              </div>
              <p className="text-xs text-slate-400">Live Hospital Beds &amp; Real-Time Token Generation</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Profile Info */}
            <div className="hidden sm:flex items-center gap-2.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <div className="w-7 h-7 rounded-full bg-teal-500/20 text-teal-300 font-bold text-xs flex items-center justify-center">
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-white leading-tight">{currentUser.name}</div>
                <div className="text-[10px] text-slate-400">{currentUser.phone}</div>
              </div>
            </div>

            {/* Switch to Admin Terminal button */}
            <button
              type="button"
              id="btn-switch-admin"
              onClick={onSwitchToAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Admin Terminal</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition"
            >
              Exit
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-6 flex-1 space-y-8">
        
        {/* Hospital Selector Bar & Emergency Hotline */}
        <section className="bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/40 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5" />
                <span>Selected Health Facility (Connected via Real-Time Grid)</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <select
                  id="patient-select-hospital"
                  value={selectedHospitalId}
                  onChange={(e) => setSelectedHospitalId(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-2xl px-4 py-2.5 text-white font-bold text-base sm:text-lg focus:border-teal-400 outline-none shadow-sm cursor-pointer"
                >
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.distanceKm} km away)
                    </option>
                  ))}
                </select>

                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-700/50 px-3 py-1.5 rounded-xl">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Trauma Center 24/7 OPEN
                </span>
              </div>
              
              <p className="text-xs text-slate-400 max-w-xl">
                {currentHospital?.address} • Emergency Hotline: <span className="text-teal-300 font-mono">{currentHospital?.emergencyContact}</span>
              </p>
            </div>

            {/* Quick Emergency Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`tel:${currentHospital?.ambulanceContact.replace(/[^0-9]/g, '')}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition active:scale-95"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Ambulance: {currentHospital?.ambulanceContact}</span>
              </a>

              <div className="flex items-center gap-1 text-[11px] text-teal-300 bg-teal-950/60 border border-teal-800/40 px-3 py-2 rounded-2xl">
                <Clock className="w-3.5 h-3.5" />
                <span>Live Sync: ~{realtimeSync.getLastPing()}ms Latency</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: Top Aggregated Metrics (Bed & Duty Staff Summary) */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Metric 1: Total Live Available Beds */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold">All Available Beds</span>
              <BedIcon className="w-4 h-4 text-teal-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono">{currentHospital?.availableBeds}</span>
              <span className="text-xs text-slate-400 font-mono">/ {currentHospital?.totalBeds} Total</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>General, Private &amp; Emergency</span>
            </div>
          </div>

          {/* Metric 2: ICU & Critical Availability */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold">ICU &amp; Ventilator Beds</span>
              <Activity className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rose-400 font-mono">{currentHospital?.icuAvailable}</span>
              <span className="text-xs text-slate-400 font-mono">/ {currentHospital?.icuTotal} ICU Beds</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-400">
              <AlertCircle className="w-3 h-3" />
              <span>High Acuity Monitoring</span>
            </div>
          </div>

          {/* Metric 3: Medical Team on Duty */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold">Active Doctors on Duty</span>
              <Stethoscope className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono">{roster?.totalDoctorsOnDuty || 28}</span>
              <span className="text-xs text-slate-400">Physicians</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-blue-400">
              <Users className="w-3 h-3" />
              <span>+{roster?.emergencyDoctorsOnCall || 8} On-Call Specialists</span>
            </div>
          </div>

          {/* Metric 4: Nursing & Support Roster */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold">Nursing &amp; Support Staff</span>
              <Users className="w-4 h-4 text-teal-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-teal-300 font-mono">
                {(roster?.totalNursesOnDuty || 64) + (roster?.supportStaffOnDuty || 42)}
              </span>
              <span className="text-xs text-slate-400">Active Staff</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
              <span>{roster?.totalNursesOnDuty} Nurses • {roster?.supportStaffOnDuty} Support</span>
            </div>
          </div>

        </section>

        {/* Section 2: Patient's Active Tokens (If any) */}
        {myTokens.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-teal-400" />
                <h2 className="text-lg font-bold text-white">Your Live OPD Digital Tokens</h2>
              </div>
              <span className="text-xs text-teal-300 font-medium">Real-time queue tracking</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myTokens.map((tok) => {
                const isNowServing = tok.status === 'NOW_SERVING';
                return (
                  <motion.div
                    key={tok.id}
                    layout
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`rounded-3xl p-5 border relative overflow-hidden transition-all ${
                      isNowServing
                        ? 'bg-gradient-to-br from-teal-950/90 to-emerald-950/70 border-teal-400 shadow-2xl shadow-teal-500/20 ring-2 ring-teal-400/40'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    {/* Live Serving Banner if called */}
                    {isNowServing && (
                      <div className="bg-emerald-500 text-slate-950 font-extrabold text-xs px-4 py-1.5 rounded-full mb-3 inline-flex items-center gap-1.5 animate-pulse">
                        <Bell className="w-3.5 h-3.5" />
                        <span>NOW SERVING — PROCEED TO ROOM {tok.roomNumber}</span>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs text-slate-400">Token Number</div>
                        <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white mt-0.5">
                          #{tok.tokenNumber}
                        </div>
                        <div className="text-sm font-semibold text-teal-300 mt-2">
                          {tok.doctorName} • {tok.department}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Room: <span className="font-semibold text-white">{tok.roomNumber}</span> • Priority: {tok.priority}
                        </div>
                      </div>

                      {/* Simulated QR Code Box */}
                      <div className="p-2.5 bg-white rounded-2xl shrink-0 flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-950 rounded-lg p-1.5 flex flex-wrap items-center justify-center gap-0.5">
                          {/* Stylized QR grid representation */}
                          <div className="w-4 h-4 bg-teal-400 rounded-sm" />
                          <div className="w-2 h-2 bg-slate-400" />
                          <div className="w-4 h-4 bg-teal-400 rounded-sm" />
                          <div className="w-2 h-2 bg-slate-400" />
                          <div className="w-3 h-3 bg-white" />
                          <div className="w-2 h-2 bg-teal-400" />
                          <div className="w-4 h-4 bg-teal-400 rounded-sm" />
                        </div>
                        <span className="text-[9px] font-mono font-bold text-slate-800 mt-1">SCAN AT DESK</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-teal-400" />
                        {isNowServing ? (
                          <span className="text-emerald-300 font-bold">Your turn has arrived!</span>
                        ) : (
                          <span>
                            Queue Position: <strong className="text-white">#{tok.queuePosition}</strong> (~{tok.estimatedWaitMinutes} mins wait)
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">Seed: {tok.qrCodeSeed}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* Section 3: Ward & Bed Availability Board */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <BedIcon className="w-5 h-5 text-teal-400" />
                <h2 className="text-xl font-bold text-white">Ward &amp; Bed Availability Board</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time ward telemetry categorized by clinical acuity level
              </p>
            </div>

            {/* Ward Category Filter Chips */}
            <div className="flex flex-wrap gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
              {(['ALL', 'EMERGENCY_TRAUMA', 'ICU', 'GENERAL', 'PRIVATE', 'ISOLATION'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setWardFilter(tab)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                    wardFilter === tab
                      ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab === 'ALL' ? 'All Wards' : tab.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Ward Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWards.map((ward) => {
              const cap = getCapacityMeta(ward.availableBeds, ward.totalBeds);
              const CapIcon = cap.icon;
              const occupancyPct = Math.round(((ward.totalBeds - ward.availableBeds) / ward.totalBeds) * 100);

              return (
                <div
                  key={ward.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg hover:border-slate-700 transition flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Name + Capacity Indicator */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">
                          {ward.type.replace('_', ' ')}
                        </span>
                        <h3 className="text-base font-bold text-white mt-0.5">{ward.name}</h3>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cap.badgeClass}`}>
                        <CapIcon className="w-3 h-3" />
                        <span>{cap.label}</span>
                      </span>
                    </div>

                    {/* Numerical Breakdown */}
                    <div className="flex items-baseline justify-between mt-4">
                      <div>
                        <div className="text-2xl font-black font-mono text-white">
                          {ward.availableBeds} <span className="text-xs text-slate-400 font-normal font-sans">Beds Vacant</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {ward.occupiedBeds} Occupied • {ward.cleaningBeds || 0} Sanitizing
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-slate-300">{occupancyPct}%</span>
                        <div className="text-[10px] text-slate-400">Occupancy</div>
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-950 rounded-full h-2 mt-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${cap.progressClass}`}
                        style={{ width: `${occupancyPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Ward Features Chips */}
                  <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800 text-slate-300">
                        🫁 {ward.oxygenEquippedBeds} O₂ Beds
                      </span>
                      <span className="bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800 text-slate-300">
                        ⚡ {ward.ventilatorBeds} Vents
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">{ward.lastUpdated}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Bed Slots Preview */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <span>Live Physical Bed Terminal Slots</span>
                <span className="text-[11px] text-slate-400">(Auto-updated by Desk Staff Terminal)</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500" /> Occupied
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500" /> Cleaning
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {beds.slice(0, 16).map((bed) => {
                let badgeColor = 'bg-emerald-950/60 border-emerald-600/50 text-emerald-300';
                if (bed.status === 'OCCUPIED') badgeColor = 'bg-rose-950/60 border-rose-600/50 text-rose-300';
                if (bed.status === 'CLEANING') badgeColor = 'bg-amber-950/60 border-amber-600/50 text-amber-300';

                return (
                  <div
                    key={bed.id}
                    className={`p-2 rounded-xl border text-center text-xs transition ${badgeColor}`}
                  >
                    <div className="font-mono font-bold">{bed.bedNumber}</div>
                    <div className="text-[9px] truncate opacity-80 mt-0.5">
                      {bed.status}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 4: Staff & Doctor Availability Tracker */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-teal-400" />
                <h2 className="text-xl font-bold text-white">Staff &amp; Doctor Availability Tracker</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Check OPD room indicators, active queues, and generate instant digital consultation tokens
              </p>
            </div>

            {/* Department Filter Pills */}
            <div className="flex flex-wrap gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
              {(['ALL', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Neurology', 'General'] as const).map((dept) => (
                <button
                  key={dept}
                  onClick={() => setDepartmentFilter(dept)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                    departmentFilter === dept
                      ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Doctors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDoctors.map((doctor) => {
              const statusMeta = getDoctorStatusMeta(doctor.status);
              const isAvailableForToken = doctor.status !== 'OFF_DUTY';
              const estimatedWait = doctor.activeQueueLength * doctor.avgConsultationTimeMin;

              return (
                <div
                  key={doctor.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg hover:border-slate-700 transition flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Doctor Avatar + Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={doctor.avatar}
                          alt={doctor.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shrink-0"
                        />
                        <div>
                          <h3 className="font-bold text-white text-base leading-tight">{doctor.name}</h3>
                          <div className="text-xs text-teal-400 font-medium">{doctor.department}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{doctor.qualification}</div>
                        </div>
                      </div>
                    </div>

                    {/* Status Indicator Chip */}
                    <div className="mt-3.5 flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusMeta.bg}`}>
                        <span className={`w-2 h-2 rounded-full ${statusMeta.dot}`} />
                        <span>{statusMeta.label}</span>
                      </span>

                      <span className="text-xs font-semibold text-slate-300 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                        Room: <strong className="text-teal-300">{doctor.roomNumber}</strong>
                      </span>
                    </div>

                    {/* Live OPD Queue Telemetry */}
                    <div className="mt-4 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Current Token Serving:</span>
                        <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                          {doctor.currentTokenNumber ? `#${doctor.currentTokenNumber}` : 'None'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Active Queue:</span>
                        <span className="font-semibold text-slate-200">
                          {doctor.activeQueueLength} patients waiting
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Est. Wait Velocity:</span>
                        <span className="text-teal-300 font-semibold">
                          ~{estimatedWait} mins ({doctor.avgConsultationTimeMin}m / patient)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Booking Action Button */}
                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-400 truncate">
                      Languages: {doctor.languages.join(', ')}
                    </div>

                    <button
                      type="button"
                      id={`btn-book-${doctor.id}`}
                      disabled={!isAvailableForToken}
                      onClick={() => handleOpenBooking(doctor)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                        isAvailableForToken
                          ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md shadow-teal-500/20 active:scale-95 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Token</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* Real-time Token Generation Modal */}
      <AnimatePresence>
        {isTokenModalOpen && selectedDoctorForBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Generate Live OPD Queue Token</h3>
                    <p className="text-xs text-slate-400">Direct admission into digital triage queue</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTokenModalOpen(false)}
                  className="text-slate-400 hover:text-white text-sm font-semibold p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleConfirmToken} className="mt-4 space-y-4">
                {/* Doctor & Hospital Details Recap */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                  <img
                    src={selectedDoctorForBooking.avatar}
                    alt={selectedDoctorForBooking.name}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-700"
                  />
                  <div>
                    <div className="text-sm font-bold text-white">{selectedDoctorForBooking.name}</div>
                    <div className="text-xs text-teal-400">{selectedDoctorForBooking.department} • Room {selectedDoctorForBooking.roomNumber}</div>
                    <div className="text-[11px] text-slate-400">{currentHospital.name}</div>
                  </div>
                </div>

                {/* Estimated Queue Speed Calculation */}
                <div className="p-3.5 rounded-2xl bg-teal-950/30 border border-teal-500/30 text-xs text-teal-200">
                  <div className="flex items-center justify-between">
                    <span>Active Queue Ahead:</span>
                    <strong className="text-white">{selectedDoctorForBooking.activeQueueLength} patients</strong>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span>Estimated Wait Time:</span>
                    <strong className="text-teal-300 font-mono text-sm">
                      ~{selectedDoctorForBooking.activeQueueLength * selectedDoctorForBooking.avgConsultationTimeMin} mins
                    </strong>
                  </div>
                </div>

                {/* Patient Information */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Patient Name</label>
                  <input
                    type="text"
                    disabled
                    value={currentUser.name}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300 font-medium"
                  />
                </div>

                {/* Priority Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Triage Priority</label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {(['NORMAL', 'SENIOR_CITIZEN', 'EMERGENCY'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setBookingPriority(p)}
                        className={`py-2 px-2 rounded-xl border font-semibold transition text-center ${
                          bookingPriority === p
                            ? 'border-teal-400 bg-teal-500/20 text-teal-200'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {p === 'NORMAL' && 'Normal'}
                        {p === 'SENIOR_CITIZEN' && 'Senior (60+)'}
                        {p === 'EMERGENCY' && 'Urgent Triage'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Symptoms Summary */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Brief Symptoms / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Chest discomfort, severe headache, follow-up..."
                    value={symptomsInput}
                    onChange={(e) => setSymptomsInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-400 text-sm text-white placeholder-slate-500 outline-none"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsTokenModalOpen(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="btn-confirm-generate-token"
                    disabled={isGenerating}
                    className="flex-1 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGenerating ? 'Generating...' : 'Confirm Token'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
