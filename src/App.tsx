import React, { useState } from 'react';
import { User } from './types';
import { DEMO_USERS } from './data/mockDatabase';
import { AuthScreen } from './components/auth/AuthScreen';
import { PatientDashboard } from './components/patient/PatientDashboard';
import { HospitalAdminTerminal } from './components/admin/HospitalAdminTerminal';
import { DualDeviceSimulator } from './components/simulator/DualDeviceSimulator';
import { BlueprintStudio } from './components/blueprint/BlueprintStudio';
import { 
  HeartPulse, 
  Building2, 
  Smartphone, 
  Layers, 
  LogOut, 
  Radio, 
  Sparkles,
  Columns
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<'PATIENT' | 'ADMIN' | 'DUAL_SIMULATOR' | 'BLUEPRINT'>('PATIENT');

  // Handle successful login from AuthScreen
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'PATIENT') {
      setActiveView('PATIENT');
    } else {
      setActiveView('ADMIN');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // If user is not logged in, show AuthScreen with quick demo logins
  if (!currentUser) {
    return (
      <div className="relative min-h-screen">
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
        
        {/* Floating Quick Action to view Blueprint even before login */}
        <div className="fixed bottom-4 right-4 z-50">
          <button
            type="button"
            onClick={() => {
              setCurrentUser(DEMO_USERS.patient);
              setActiveView('BLUEPRINT');
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900/90 hover:bg-slate-850 text-teal-300 border border-teal-500/40 shadow-xl backdrop-blur-md text-xs font-bold transition hover:scale-105 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-teal-400" />
            <span>View Architecture Blueprint &amp; Code</span>
          </button>
        </div>
      </div>
    );
  }

  // If in Dual Device Simulator view
  if (activeView === 'DUAL_SIMULATOR') {
    return (
      <DualDeviceSimulator
        patientUser={DEMO_USERS.patient}
        adminUser={DEMO_USERS.admin}
        onExitSplit={() => setActiveView(currentUser.role === 'PATIENT' ? 'PATIENT' : 'ADMIN')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Application Switcher Bar */}
      <div className="bg-slate-900/95 border-b border-slate-800 px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white tracking-tight">Swasthya Setu</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
                v1.0-PROD
              </span>
            </div>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveView('PATIENT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeView === 'PATIENT'
                ? 'bg-teal-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Patient Portal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('ADMIN')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeView === 'ADMIN'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Hospital Desk Admin</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('DUAL_SIMULATOR')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition bg-gradient-to-r from-teal-950 to-blue-950 hover:from-teal-900 hover:to-blue-900 text-teal-200 border border-teal-500/30 cursor-pointer"
          >
            <Columns className="w-3.5 h-3.5 text-teal-400" />
            <span>Multi-Device Sync Split</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('BLUEPRINT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeView === 'BLUEPRINT'
                ? 'bg-teal-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Blueprint &amp; Code</span>
          </button>
        </div>

        {/* User Account & Exit */}
        <div className="flex items-center gap-2">
          <div className="text-right hidden md:block">
            <div className="text-xs font-semibold text-white leading-tight">{currentUser.name}</div>
            <div className="text-[10px] text-teal-400">{currentUser.role === 'PATIENT' ? 'Patient' : 'Hospital Admin'}</div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Log out and return to welcome auth"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body View Render */}
      <div className="flex-1">
        {activeView === 'PATIENT' && (
          <PatientDashboard
            currentUser={currentUser}
            onSwitchToAdmin={() => setActiveView('ADMIN')}
            onLogout={handleLogout}
          />
        )}

        {activeView === 'ADMIN' && (
          <HospitalAdminTerminal
            currentUser={currentUser}
            onSwitchToPatient={() => setActiveView('PATIENT')}
            onLogout={handleLogout}
          />
        )}

        {activeView === 'BLUEPRINT' && (
          <div className="p-4 sm:p-8 max-w-7xl mx-auto">
            <BlueprintStudio />
          </div>
        )}
      </div>
    </div>
  );
}
