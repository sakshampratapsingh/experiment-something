import React, { useState, useEffect } from 'react';
import { 
  User, 
  Hospital, 
  Ward, 
  Bed, 
  Doctor, 
  StaffRoster, 
  Token, 
  BedStatus, 
  DoctorStatus 
} from '../../types';
import { realtimeSync } from '../../services/realtimeSync';
import { 
  Building2, 
  Bed as BedIcon, 
  Users, 
  Stethoscope, 
  BellRing, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  Plus, 
  Minus, 
  RefreshCw, 
  Radio, 
  Volume2, 
  Sparkles,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HospitalAdminTerminalProps {
  currentUser: User;
  onSwitchToPatient: () => void;
  onLogout: () => void;
}

export const HospitalAdminTerminal: React.FC<HospitalAdminTerminalProps> = ({
  currentUser,
  onSwitchToPatient,
  onLogout,
}) => {
  const hospitalId = currentUser.hospitalId || 'hosp-aiims-delhi';

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [roster, setRoster] = useState<StaffRoster | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);

  // Selected doctor for queue management
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('doc-priya-cardio');
  
  // Selected bed for occupancy editing
  const [editingBed, setEditingBed] = useState<Bed | null>(null);
  const [admitPatientName, setAdmitPatientName] = useState('');

  // Call status alert banner
  const [lastActionMessage, setLastActionMessage] = useState<string>('');

  const refreshState = () => {
    setHospitals(realtimeSync.getHospitals());
    setWards(realtimeSync.getWards(hospitalId));
    setBeds(realtimeSync.getBeds(hospitalId));
    setDoctors(realtimeSync.getDoctors(hospitalId));
    setRoster(realtimeSync.getStaffRoster(hospitalId));
    setTokens(realtimeSync.getTokens(hospitalId));
  };

  useEffect(() => {
    refreshState();

    const unsubscribe = realtimeSync.subscribe((event) => {
      refreshState();
      if (event.type === 'TOKEN_GENERATED') {
        setLastActionMessage(`⚡ New Token Generated: #${event.payload.token.tokenNumber} for ${event.payload.token.doctorName}`);
      }
    });

    return () => unsubscribe();
  }, [hospitalId]);

  const currentHospital = hospitals.find((h) => h.id === hospitalId) || hospitals[0];
  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId) || doctors[0];

  // Active queue for selected doctor
  const doctorTokens = tokens.filter((t) => t.doctorId === selectedDoctorId);
  const currentlyServingToken = doctorTokens.find((t) => t.status === 'NOW_SERVING');
  const waitingTokens = doctorTokens
    .filter((t) => t.status === 'WAITING')
    .sort((a, b) => a.queuePosition - b.queuePosition);
  const completedTokens = doctorTokens.filter((t) => t.status === 'COMPLETED');

  // Handle Calling Next Token
  const handleCallNextToken = () => {
    if (!selectedDoctor) return;
    const { calledToken, completedToken } = realtimeSync.callNextToken(selectedDoctor.id);

    if (calledToken) {
      setLastActionMessage(`📢 CALLED TOKEN #${calledToken.tokenNumber} (${calledToken.patientName}) to Room ${selectedDoctor.roomNumber}!`);
    } else {
      setLastActionMessage(`✅ OPD Queue for ${selectedDoctor.name} is now empty! All patients served.`);
    }
  };

  // Handle Doctor Status Change
  const handleDoctorStatusChange = (newStatus: DoctorStatus) => {
    if (!selectedDoctor) return;
    realtimeSync.updateDoctorStatus(selectedDoctor.id, newStatus);
    setLastActionMessage(`Updated ${selectedDoctor.name} status to ${newStatus.replace('_', ' ')}`);
  };

  // Handle Staff Roster Stepper
  const handleStaffRosterDelta = (field: 'nurses' | 'support' | 'doctors', delta: number) => {
    realtimeSync.updateStaffCounts(hospitalId, { [field]: delta });
    setLastActionMessage(`Updated staff roster on duty count (${field}: ${delta > 0 ? '+' : ''}${delta})`);
  };

  // Handle Bed Status update
  const handleSaveBedStatus = (newStatus: BedStatus) => {
    if (!editingBed) return;
    realtimeSync.updateBedStatus(hospitalId, editingBed.id, newStatus, admitPatientName);
    setLastActionMessage(`Bed #${editingBed.bedNumber} marked as ${newStatus} (Synchronized)`);
    setEditingBed(null);
    setAdmitPatientName('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-150 flex flex-col pb-16">
      
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md px-4 sm:px-8 py-3.5 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
              <Building2 className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white">Swasthya Setu</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  HOSPITAL ADMIN &amp; DESK TERMINAL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {currentHospital?.name} • Live Terminal ID: <span className="font-mono text-teal-300">{realtimeSync.getTerminalId()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Sync Status Pill */}
            <div className="flex items-center gap-1.5 text-xs text-teal-300 bg-teal-950/60 border border-teal-800/50 px-3 py-1.5 rounded-xl font-medium">
              <Radio className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
              <span>BroadcastSync: {realtimeSync.getLastPing()}ms</span>
            </div>

            {/* Test Audio Chime */}
            <button
              type="button"
              onClick={() => realtimeSync.playHospitalChime()}
              title="Test hospital chime synthesizer"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Switch to Patient Portal */}
            <button
              type="button"
              id="btn-admin-switch-patient"
              onClick={onSwitchToPatient}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-semibold transition"
            >
              <span>Patient View</span>
              <ArrowRight className="w-3.5 h-3.5" />
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-6 flex-1 space-y-6">
        
        {/* Action Confirmation Banner */}
        <AnimatePresence>
          {lastActionMessage && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl px-4 py-3 text-emerald-200 text-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">{lastActionMessage}</span>
              </div>
              <button
                onClick={() => setLastActionMessage('')}
                className="text-slate-400 hover:text-white text-xs font-bold ml-2"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section 1: OPD Active Token Queue Controller (The core request) */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-bold text-white">OPD Live Token Queue Controller</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Calling next token instantly synchronizes across all patient mobile devices &amp; public display boards
              </p>
            </div>

            {/* Doctor Selector */}
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-semibold text-slate-400">Select Doctor Console:</label>
              <select
                id="admin-select-doctor"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-xs sm:text-sm focus:border-emerald-400 outline-none"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.department} • Room {d.roomNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Doctor Queue Card & Big Call Action */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            
            {/* Left Col: Currently Serving Token */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  CURRENTLY IN CONSULTATION
                </span>
                {currentlyServingToken ? (
                  <div className="mt-3">
                    <div className="text-4xl font-black font-mono text-white tracking-tight">
                      #{currentlyServingToken.tokenNumber}
                    </div>
                    <div className="text-base font-bold text-teal-300 mt-2">
                      {currentlyServingToken.patientName}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Phone: {currentlyServingToken.patientPhone} • Priority: {currentlyServingToken.priority}
                    </div>
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                      <strong>Notes:</strong> {currentlyServingToken.symptomsSummary}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    No token currently in consultation. Click "Call Next Token" to begin.
                  </div>
                )}
              </div>

              {/* Status Switcher for Doctor */}
              <div className="mt-5 pt-3 border-t border-slate-800/80">
                <span className="text-xs text-slate-400 font-medium block mb-2">Doctor Clinical Status</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(['AVAILABLE', 'IN_CONSULTATION', 'IN_SURGERY', 'OFF_DUTY'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleDoctorStatusChange(st)}
                      className={`py-1.5 px-2 rounded-lg border font-semibold text-[11px] transition ${
                        selectedDoctor?.status === st
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Middle Col: Waiting Queue List */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    WAITING QUEUE ({waitingTokens.length} PATIENTS)
                  </span>
                  <span className="text-xs text-slate-400">Est. speed: {selectedDoctor?.avgConsultationTimeMin}m/pt</span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {waitingTokens.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs">
                      No patients in waiting line for {selectedDoctor?.name}
                    </div>
                  ) : (
                    waitingTokens.map((tok, index) => (
                      <div
                        key={tok.id}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                          index === 0
                            ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-white">#{tok.tokenNumber}</span>
                            <span className="font-semibold text-xs">{tok.patientName}</span>
                            {tok.priority !== 'NORMAL' && (
                              <span className="text-[9px] bg-rose-950 border border-rose-700/50 text-rose-300 px-1.5 py-0.5 rounded">
                                {tok.priority}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Position #{tok.queuePosition} • Est. wait ~{tok.estimatedWaitMinutes} mins
                          </div>
                        </div>
                        {index === 0 && (
                          <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                            NEXT IN LINE
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Call Next Button */}
              <div className="mt-4 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  id="btn-admin-call-next"
                  onClick={handleCallNextToken}
                  disabled={waitingTokens.length === 0 && !currentlyServingToken}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-[0.99] text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <BellRing className="w-5 h-5" />
                  <span>CALL NEXT PATIENT TOKEN</span>
                </button>
              </div>
            </div>

            {/* Right Col: Completed Queue History */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  TODAY'S COMPLETED CONSULTATIONS ({completedTokens.length})
                </span>
                <div className="space-y-2 mt-3 max-h-60 overflow-y-auto pr-1">
                  {completedTokens.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs">
                      No completed tokens recorded yet for this session.
                    </div>
                  ) : (
                    completedTokens.map((tok) => (
                      <div
                        key={tok.id}
                        className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-mono font-bold text-white">#{tok.tokenNumber}</span>
                          <span className="text-slate-300 ml-2">{tok.patientName}</span>
                        </div>
                        <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Done
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 text-center">
                Automated electronic health record linkage active
              </div>
            </div>

          </div>
        </section>

        {/* Section 2: Bed Occupancy Manager & Ward Controller */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <BedIcon className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-bold text-white">Ward Bed Status Controller</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any bed to toggle state: Available ➔ Occupied ➔ Sanitization. All changes broadcast live.
              </p>
            </div>

            {/* Quick Status Legend */}
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Available
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded bg-rose-500" /> Occupied
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded bg-amber-500" /> Cleaning
              </span>
            </div>
          </div>

          {/* Grid of Interactive Beds */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-5">
            {beds.map((bed) => {
              let colorClasses = 'bg-emerald-950/40 border-emerald-500/40 hover:border-emerald-400 text-emerald-200';
              if (bed.status === 'OCCUPIED') {
                colorClasses = 'bg-rose-950/40 border-rose-500/40 hover:border-rose-400 text-rose-200';
              } else if (bed.status === 'CLEANING') {
                colorClasses = 'bg-amber-950/40 border-amber-500/40 hover:border-amber-400 text-amber-200';
              }

              return (
                <button
                  key={bed.id}
                  type="button"
                  id={`bed-btn-${bed.id}`}
                  onClick={() => {
                    setEditingBed(bed);
                    setAdmitPatientName(bed.patientName || '');
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${colorClasses}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-extrabold text-sm">{bed.bedNumber}</span>
                    <span className="text-[10px] font-bold uppercase">{bed.status}</span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-300 mt-1 truncate">
                    {bed.wardType.replace('_', ' ')}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                    {bed.patientName || (bed.status === 'AVAILABLE' ? 'Vacant' : 'Sanitizing')}
                  </div>
                  <div className="mt-2 text-[9px] flex gap-1">
                    {bed.hasOxygen && <span className="bg-slate-900/80 px-1.5 py-0.5 rounded text-teal-300">O₂</span>}
                    {bed.hasVentilator && <span className="bg-slate-900/80 px-1.5 py-0.5 rounded text-rose-300">Vent</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 3: Staff Roster Management Stepper */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-teal-400" />
            <h2 className="text-xl font-bold text-white">Live On-Duty Staff &amp; Clinical Roster Controller</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Doctors Stepper */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold block">Total Doctors on Duty</span>
                <span className="text-2xl font-black font-mono text-white mt-1 block">
                  {roster?.totalDoctorsOnDuty}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStaffRosterDelta('doctors', -1)}
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-lg cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleStaffRosterDelta('doctors', 1)}
                  className="w-9 h-9 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center justify-center font-bold text-lg cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Nurses Stepper */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold block">Nursing Staff on Duty</span>
                <span className="text-2xl font-black font-mono text-teal-300 mt-1 block">
                  {roster?.totalNursesOnDuty}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStaffRosterDelta('nurses', -1)}
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-lg cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleStaffRosterDelta('nurses', 1)}
                  className="w-9 h-9 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center justify-center font-bold text-lg cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Support Staff Stepper */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold block">Support &amp; Orderlies</span>
                <span className="text-2xl font-black font-mono text-white mt-1 block">
                  {roster?.supportStaffOnDuty}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStaffRosterDelta('support', -1)}
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-lg cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleStaffRosterDelta('support', 1)}
                  className="w-9 h-9 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center justify-center font-bold text-lg cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Bed Status Modification Modal */}
      <AnimatePresence>
        {editingBed && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-white text-base">Update Bed #{editingBed.bedNumber}</h3>
                  <p className="text-xs text-slate-400">{editingBed.wardType.replace('_', ' ')} Ward</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingBed(null)}
                  className="text-slate-400 hover:text-white text-sm font-semibold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select New Bed Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveBedStatus('AVAILABLE')}
                      className="py-2.5 px-2 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 font-bold text-xs hover:bg-emerald-900/60 transition"
                    >
                      Mark Available
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveBedStatus('OCCUPIED')}
                      className="py-2.5 px-2 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-300 font-bold text-xs hover:bg-rose-900/60 transition"
                    >
                      Admit Patient
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveBedStatus('CLEANING')}
                      className="py-2.5 px-2 rounded-xl bg-amber-950/80 border border-amber-500 text-amber-300 font-bold text-xs hover:bg-amber-900/60 transition"
                    >
                      Sanitization
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Patient Name (Required if Admitting)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Chandra (52M) - Trauma Admit"
                    value={admitPatientName}
                    onChange={(e) => setAdmitPatientName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-400 text-sm text-white placeholder-slate-500 outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleSaveBedStatus('OCCUPIED')}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                  >
                    Confirm Admission &amp; Broadcast Live
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
