import React from 'react';
import { User } from '../../types';
import { PatientDashboard } from '../patient/PatientDashboard';
import { HospitalAdminTerminal } from '../admin/HospitalAdminTerminal';
import { Smartphone, Monitor, Radio, Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import { realtimeSync } from '../../services/realtimeSync';

interface DualDeviceSimulatorProps {
  patientUser: User;
  adminUser: User;
  onExitSplit: () => void;
}

export const DualDeviceSimulator: React.FC<DualDeviceSimulatorProps> = ({
  patientUser,
  adminUser,
  onExitSplit,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Simulation Banner Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white">Live Multi-Device Synchronization Simulator</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                ACTIVE BUS • {realtimeSync.getLastPing()}ms LATENCY
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Left: Patient's Smartphone Terminal • Right: Hospital Desk Admin Console. Click actions on the right to watch the left screen react in real-time!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => realtimeSync.resetAllToSeed()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo State</span>
          </button>

          <button
            type="button"
            onClick={onExitSplit}
            className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition cursor-pointer"
          >
            Exit Split View
          </button>
        </div>
      </div>

      {/* Side-by-Side Split View Container */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-0 overflow-hidden">
        
        {/* Left 5 Cols: Patient Mobile View (Framed inside a realistic Smartphone viewport) */}
        <div className="xl:col-span-5 bg-slate-950 p-4 sm:p-6 flex flex-col items-center justify-start border-r border-slate-800 overflow-y-auto max-h-[calc(100vh-56px)]">
          
          <div className="flex items-center justify-between w-full max-w-md mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-400">
              <Smartphone className="w-4 h-4" />
              <span>📱 Patient Mobile Terminal (Aarav Sharma)</span>
            </div>
            <span className="text-[10px] text-slate-400">PWA / React Native / Flutter</span>
          </div>

          {/* Smartphone Shell */}
          <div className="w-full max-w-md rounded-[2.5rem] border-4 border-slate-700 bg-slate-950 shadow-2xl overflow-hidden flex flex-col relative">
            {/* Speaker & Camera Notch */}
            <div className="w-full bg-slate-900 py-1.5 flex justify-center items-center relative z-20 border-b border-slate-800">
              <div className="w-20 h-4 bg-slate-950 rounded-full flex items-center justify-end px-2">
                <div className="w-2 h-2 rounded-full bg-slate-800" />
              </div>
            </div>

            {/* Mobile Viewport Screen */}
            <div className="h-[750px] overflow-y-auto bg-slate-950">
              <PatientDashboard
                currentUser={patientUser}
                onSwitchToAdmin={() => {}}
                onLogout={onExitSplit}
              />
            </div>

            {/* Home indicator bar */}
            <div className="w-full bg-slate-950 py-2 flex justify-center items-center border-t border-slate-900">
              <div className="w-32 h-1 bg-slate-600 rounded-full" />
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Hospital Desk Terminal (Desktop view) */}
        <div className="xl:col-span-7 bg-slate-950 flex flex-col overflow-y-auto max-h-[calc(100vh-56px)]">
          <div className="p-3 bg-slate-900/60 border-b border-slate-800 px-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <Monitor className="w-4 h-4" />
              <span>🏥 Hospital OPD Desk &amp; Bed Administration Terminal (AIIMS Central)</span>
            </div>
            <span className="text-[11px] text-slate-400">Master Authority Node</span>
          </div>

          <div className="flex-1">
            <HospitalAdminTerminal
              currentUser={adminUser}
              onSwitchToPatient={() => {}}
              onLogout={onExitSplit}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
