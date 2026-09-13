import React, { useState, useEffect } from 'react';
import { 
  UserRole, 
  User 
} from '../../types';
import { DEMO_USERS } from '../../data/mockDatabase';
import { 
  HeartPulse, 
  Building2, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Lock, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  KeyRound, 
  Hospital as HospitalIcon, 
  Sparkles,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [selectedRole, setSelectedRole] = useState<UserRole>('PATIENT');
  const [authMethod, setAuthMethod] = useState<'EMAIL' | 'PHONE'>('EMAIL');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('AIIMS New Delhi (Apex Center)');

  // OTP flow
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState(['', '', '', '', '', '']);
  const [simulatedCode, setSimulatedCode] = useState('839201');
  const [resendTimer, setResendTimer] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let interval: any;
    if (otpSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, resendTimer]);

  const handleSendOtp = () => {
    if (!phone || phone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }
    setErrorMessage('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      setSimulatedCode(randomCode);
      setOtpSent(true);
      setResendTimer(30);
    }, 600);
  };

  const handleVerifyOtp = () => {
    const entered = otpValue.join('');
    if (entered.length < 6) {
      setErrorMessage('Please enter the full 6-digit OTP code');
      return;
    }
    if (entered !== simulatedCode && entered !== '123456') {
      setErrorMessage(`Invalid OTP. Please enter the generated code: ${simulatedCode}`);
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const user: User = {
        id: `usr-${Date.now()}`,
        name: name || (selectedRole === 'PATIENT' ? 'Verified Patient' : 'Desk Admin'),
        email: email || `${phone}@swasthyasetu.gov.in`,
        phone: phone.startsWith('+91') ? phone : `+91 ${phone}`,
        role: selectedRole,
        hospitalId: selectedRole === 'HOSPITAL_ADMIN' ? 'hosp-aiims-delhi' : undefined,
        hospitalName: selectedRole === 'HOSPITAL_ADMIN' ? selectedHospital : undefined,
        createdAt: new Date().toISOString(),
      };
      onLoginSuccess(user);
    }, 500);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please provide both email and password');
      return;
    }
    if (authMode === 'REGISTER' && !name) {
      setErrorMessage('Please enter your full name');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setTimeout(() => {
      setIsLoading(false);
      const user: User = {
        id: `usr-${Date.now()}`,
        name: name || (selectedRole === 'PATIENT' ? email.split('@')[0] : 'Hospital Operator'),
        email: email,
        phone: phone || '+91 98765 00000',
        role: selectedRole,
        hospitalId: selectedRole === 'HOSPITAL_ADMIN' ? 'hosp-aiims-delhi' : undefined,
        hospitalName: selectedRole === 'HOSPITAL_ADMIN' ? selectedHospital : undefined,
        createdAt: new Date().toISOString(),
      };
      onLoginSuccess(user);
    }, 500);
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    if (role === 'PATIENT') {
      onLoginSuccess(DEMO_USERS.patient);
    } else {
      onLoginSuccess(DEMO_USERS.admin);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      val = val.slice(-1);
    }
    const newOtp = [...otpValue];
    newOtp[index] = val;
    setOtpValue(newOtp);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-150 flex flex-col justify-between relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation / Branding Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-teal-500/20">
              <HeartPulse className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">Swasthya Setu</span>
                <span className="bg-teal-500/15 text-teal-300 text-xs font-semibold px-2 py-0.5 rounded-full border border-teal-500/30">
                  National OPD &amp; Bed Grid
                </span>
              </div>
              <p className="text-xs text-slate-400">Real-Time Hospital Management &amp; Patient Coordination</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Hospital Grid Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 md:py-12 flex flex-col items-center justify-center z-10">
        <div className="w-full max-w-xl">
          
          {/* Quick Demo Selector Ribbon */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3 rounded-2xl bg-gradient-to-r from-teal-950/70 via-slate-900 to-blue-950/70 border border-teal-500/30 shadow-xl backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-300">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>Instant 1-Click Sandbox Logins</span>
              </div>
              <span className="text-[11px] text-slate-400">Pre-seeded realistic records</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-demo-patient"
                onClick={() => handleQuickDemoLogin('PATIENT')}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 hover:border-teal-400/50 text-left transition text-xs font-medium text-slate-200 group"
              >
                <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate">Patient: Aarav Sharma</div>
                  <div className="text-[10px] text-slate-400 truncate">Book tokens &amp; track live ICU beds</div>
                </div>
              </button>

              <button
                type="button"
                id="btn-demo-admin"
                onClick={() => handleQuickDemoLogin('HOSPITAL_ADMIN')}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 hover:border-emerald-400/50 text-left transition text-xs font-medium text-slate-200 group"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate">AIIMS Desk: Dr. Priya</div>
                  <div className="text-[10px] text-slate-400 truncate">Call tokens &amp; toggle live beds</div>
                </div>
              </button>
            </div>
          </motion.div>

          {/* Core Auth Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            
            {/* Mode Switcher Tabs: Login vs Register */}
            <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-6">
              <button
                type="button"
                id="tab-login"
                onClick={() => { setAuthMode('LOGIN'); setErrorMessage(''); }}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  authMode === 'LOGIN'
                    ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                id="tab-register"
                onClick={() => { setAuthMode('REGISTER'); setErrorMessage(''); }}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  authMode === 'REGISTER'
                    ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Role Selection Box */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Patient Role Button */}
                <button
                  type="button"
                  id="role-patient"
                  onClick={() => setSelectedRole('PATIENT')}
                  className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                    selectedRole === 'PATIENT'
                      ? 'border-teal-400 bg-teal-500/10 shadow-lg shadow-teal-500/10'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      selectedRole === 'PATIENT' ? 'bg-teal-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      <HeartPulse className="w-4 h-4" />
                    </div>
                    {selectedRole === 'PATIENT' && (
                      <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    )}
                  </div>
                  <div className="font-bold text-sm text-white">Patient Role</div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Search hospitals, view live beds, book tokens
                  </div>
                </button>

                {/* Hospital Admin / Staff Role Button */}
                <button
                  type="button"
                  id="role-admin"
                  onClick={() => setSelectedRole('HOSPITAL_ADMIN')}
                  className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                    selectedRole === 'HOSPITAL_ADMIN'
                      ? 'border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      selectedRole === 'HOSPITAL_ADMIN' ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    {selectedRole === 'HOSPITAL_ADMIN' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <div className="font-bold text-sm text-white">Hospital Desk</div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Update bed status, duty staff, &amp; call tokens
                  </div>
                </button>
              </div>
            </div>

            {/* Auth Method Toggle: Email vs Phone OTP */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
              <span className="text-xs text-slate-400">Authentication Method</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  id="auth-method-email"
                  onClick={() => { setAuthMethod('EMAIL'); setErrorMessage(''); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    authMethod === 'EMAIL'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email &amp; Password
                </button>
                <button
                  type="button"
                  id="auth-method-phone"
                  onClick={() => { setAuthMethod('PHONE'); setErrorMessage(''); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    authMethod === 'PHONE'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  Mobile OTP
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form Fields: Email Flow */}
            {authMethod === 'EMAIL' && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {authMode === 'REGISTER' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      id="input-name"
                      placeholder={selectedRole === 'PATIENT' ? 'e.g. Rahul Sharma' : 'e.g. Dr. Priya Nair'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 text-sm text-white placeholder-slate-500 outline-none transition"
                    />
                  </div>
                )}

                {selectedRole === 'HOSPITAL_ADMIN' && authMode === 'REGISTER' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Hospital Center</label>
                    <select
                      id="select-hospital"
                      value={selectedHospital}
                      onChange={(e) => setSelectedHospital(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-400 text-sm text-white outline-none"
                    >
                      <option value="AIIMS New Delhi (Apex Center)">AIIMS New Delhi (Apex Center)</option>
                      <option value="Safdarjung Super Specialty Hospital">Safdarjung Super Specialty Hospital</option>
                      <option value="Indraprastha Apollo Hospitals">Indraprastha Apollo Hospitals</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                    <input
                      type="email"
                      id="input-email"
                      placeholder={selectedRole === 'PATIENT' ? 'patient@domain.com' : 'admin@hospital.gov.in'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 text-sm text-white placeholder-slate-500 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                    <input
                      type="password"
                      id="input-password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 text-sm text-white placeholder-slate-500 outline-none transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-submit-email"
                  disabled={isLoading}
                  className="w-full mt-2 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 active:scale-[0.99] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition cursor-pointer"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{authMode === 'LOGIN' ? 'Access Swasthya Setu' : 'Complete Registration'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Form Fields: Phone OTP Flow */}
            {authMethod === 'PHONE' && (
              <div className="space-y-4">
                {!otpSent ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Mobile Number</label>
                    <div className="flex gap-2">
                      <div className="px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-sm font-mono flex items-center">
                        🇮🇳 +91
                      </div>
                      <input
                        type="tel"
                        id="input-phone"
                        maxLength={10}
                        placeholder="98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 text-sm text-white placeholder-slate-500 font-mono outline-none transition"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">
                      A 6-digit OTP will be dispatched via Aadhaar-linked SMS gateway.
                    </p>

                    <button
                      type="button"
                      id="btn-send-otp"
                      onClick={handleSendOtp}
                      disabled={isLoading}
                      className="w-full mt-4 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 active:scale-[0.99] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition cursor-pointer"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" />
                          <span>Send 6-Digit OTP</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-teal-950/40 border border-teal-500/30 text-teal-200 text-xs flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                          <span>OTP Dispatched to +91 {phone}</span>
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5">
                          Simulated Security Code: <span className="font-mono font-bold text-teal-300 bg-teal-950/80 px-1.5 py-0.5 rounded">{simulatedCode}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpValue(simulatedCode.split(''));
                        }}
                        className="text-[11px] text-teal-400 hover:text-teal-300 underline font-semibold cursor-pointer"
                      >
                        Auto-Fill
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-2">Enter 6-Digit OTP</label>
                      <div className="flex gap-2 justify-between">
                        {otpValue.map((digit, idx) => (
                          <input
                            key={idx}
                            id={`otp-input-${idx}`}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                            className="w-11 h-12 text-center rounded-xl bg-slate-950 border border-slate-700 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 text-lg font-mono font-bold text-white outline-none"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Didn't receive code?</span>
                      {resendTimer > 0 ? (
                        <span className="text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Resend in {resendTimer}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          className="text-teal-400 hover:text-teal-300 font-semibold cursor-pointer"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      id="btn-verify-otp"
                      onClick={handleVerifyOtp}
                      disabled={isLoading}
                      className="w-full py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 active:scale-[0.99] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition cursor-pointer"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Verify &amp; Enter Platform</span>
                        </>
                      )}
                    </button>
                  </motion.div>
                )}
              </div>
            )}

            {/* Compliance & Security Footer */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>ABDM-Compliant Health Facility Node</span>
              </div>
              <span>NABH Digital Standard</span>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950 px-6 py-4 text-center text-xs text-slate-400">
        <p>Swasthya Setu Platform • Real-Time Health Stack • Ministry of Health &amp; Family Welfare Architecture Standard</p>
      </footer>
    </div>
  );
};
