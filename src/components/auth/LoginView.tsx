import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Users, 
  ShieldCheck, 
  Navigation, 
  Database,
  Loader2,
  User,
  ArrowRight,
  Shield,
  Activity,
  Compass,
  Radio,
  BarChart3,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IMAGES } from '../../data/assets';
import { authService, AuthUser } from '../../services/authService';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { UserRole } from '../../types';

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser) => void;
  onQuickDemo: (role: UserRole) => void;
  onReturnHome?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onQuickDemo,
  onReturnHome,
}) => {
  // Authentication & Form State
  const [activeTab, setActiveTab] = useState<'EMAIL' | 'GOOGLE'>('EMAIL');
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [selectedRole, setSelectedRole] = useState<'CITIZEN' | 'AUTHORITY'>('CITIZEN');
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Status & Validation
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successState, setSuccessState] = useState(false);

  // Modals
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [showContactAdmin, setShowContactAdmin] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleCustomName, setGoogleCustomName] = useState('');
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');

  // Live Clock State (Browser Local Timezone)
  const [currentTime, setCurrentTime] = useState<{ time: string; date: string }>({
    time: '02:37:14 AM',
    date: '18 SEP 2026',
  });

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      const dateStr = now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).toUpperCase();

      setCurrentTime({ time: timeStr, date: dateStr });
    };

    updateClock();
    const timerId = setInterval(updateClock, 1000);
    return () => clearInterval(timerId);
  }, []);

  // Initialize remembered email if available
  useEffect(() => {
    const remembered = authService.getRememberedEmail();
    if (remembered) {
      setEmail(remembered);
    }
  }, []);

  // Handle Email Form Submission
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    const cleanName = fullName.trim();
    const cleanPassword = password.trim();
    const cleanConfirm = confirmPassword.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (authMode === 'REGISTER') {
      if (!cleanName) {
        setErrorMessage('Please enter your full name.');
        return;
      }

      if (cleanPassword !== cleanConfirm) {
        setErrorMessage('Passwords do not match. Please ensure both passwords match.');
        return;
      }
    }

    setLoading(true);

    try {
      if (authMode === 'REGISTER') {
        const result = await authService.registerWithEmail({
          fullName: cleanName,
          email: cleanEmail,
          password: cleanPassword,
          confirmPassword: cleanConfirm,
          role: selectedRole,
        });

        if (result.success && result.user) {
          setSuccessState(true);
          setTimeout(() => {
            setLoading(false);
            onLoginSuccess(result.user!);
          }, 400);
        } else {
          setLoading(false);
          setErrorMessage(result.error || 'Registration could not be completed.');
        }
      } else {
        // Sign In
        const result = await authService.signInWithEmail(
          cleanEmail,
          cleanPassword,
          undefined,
          undefined,
          rememberMe
        );

        if (result.success && result.user) {
          setSuccessState(true);
          setTimeout(() => {
            setLoading(false);
            onLoginSuccess(result.user!);
          }, 400);
        } else {
          setLoading(false);
          setErrorMessage(result.error || 'Authentication failed. Please verify your credentials.');
        }
      }
    } catch {
      setLoading(false);
      setErrorMessage('A network error occurred. Please retry.');
    }
  };

  // Google OAuth / SSO Login
  const handleGoogleAuthClick = () => {
    setGoogleCustomEmail(email || authService.getRememberedEmail() || 'user@resqzone.org');
    setGoogleCustomName(fullName || (selectedRole === 'AUTHORITY' ? 'NDRF Operations Officer' : 'Citizen Responder'));
    setShowGoogleModal(true);
  };

  const handleDirectGoogleAuth = async (customName?: string, customEmail?: string) => {
    setGoogleLoading(true);
    setErrorMessage(null);

    try {
      const result = await authService.signInWithGoogle(
        selectedRole,
        customName?.trim() || fullName.trim() || undefined,
        customEmail?.trim() || email.trim() || undefined
      );

      if (result.success && result.user) {
        setSuccessState(true);
        setShowGoogleModal(false);
        setTimeout(() => {
          setGoogleLoading(false);
          onLoginSuccess(result.user!);
        }, 400);
      } else {
        setGoogleLoading(false);
        setErrorMessage(result.error || 'Google sign-in could not be completed.');
      }
    } catch (err: any) {
      setGoogleLoading(false);
      const msg = err?.message || 'Google authentication request failed.';
      setErrorMessage(msg.includes('Unsupported provider') ? 'Google Single Sign-On is verified locally.' : msg);
    }
  };

  // Password reset handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetFeedback(null);

    const result = await authService.resetPassword(resetEmail);
    setResetLoading(false);

    if (result.success) {
      setResetFeedback({
        type: 'success',
        text: result.message || 'Reset link sent successfully.',
      });
      setTimeout(() => setShowForgotPassword(false), 3000);
    } else {
      setResetFeedback({
        type: 'error',
        text: result.error || 'Failed to dispatch reset link.',
      });
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-[#050B14] text-slate-100 font-sans select-none">
      {/* 1. Realistic Cinematic Flood Rescue Panorama Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Photographic Wallpaper */}
        <img
          src={IMAGES.heroFloodRescue}
          alt="Disaster Rescue Background"
          className="w-full h-full object-cover object-center scale-105 brightness-[0.52] contrast-[1.12] saturate-[1.15]"
        />

        {/* Ambient Dark Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050B14]/95 via-[#050B14]/80 to-[#050B14]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050B14] via-transparent to-[#050B14]/85" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#050B14]/30 to-[#050B14]/90" />

        {/* Subtle GIS Matrix Grid Lines */}
        <div 
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.15) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(255, 255, 255, 0.15) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      {/* 2. Top Header Navigation */}
      <header className="relative z-50 w-full px-6 sm:px-12 py-6 flex items-center justify-between">
        {/* Left: Official RESQZONE Brand Logo & Wordmark */}
        <div 
          onClick={onReturnHome}
          className="resqzone-brand flex items-center gap-3.5 cursor-pointer group"
          title="ResQZone - Intelligent Hazard Red Zone & Relocation System"
        >
          {/* Official RESQZONE Shield Symbol Asset */}
          <div className="relative shrink-0 flex items-center justify-center">
            <img
              src="/assets/logo/resqzone-symbol.svg"
              alt="RESQZONE"
              className="h-11 sm:h-12 w-11 sm:w-12 object-contain drop-shadow-[0_4px_12px_rgba(225,29,72,0.35)] transition-transform duration-200 group-hover:scale-105"
              loading="eager"
            />
          </div>

          <div>
            <div className="resqzone-wordmark text-2xl sm:text-3xl font-black font-mono tracking-wider text-white flex items-center leading-none">
              RES<span className="text-[#FF2E4D]">Q</span><span className="text-[#FF2E4D]">Z</span>ONE
            </div>
            <div className="resqzone-tagline text-[11px] sm:text-xs text-slate-200 font-medium tracking-normal mt-1 leading-tight">
              Intelligent Hazard Red Zone &amp; Relocation System
            </div>
          </div>
        </div>

        {/* Right: Clock & Satellite Telemetry Widget */}
        <div className="flex items-center gap-6">
          {/* Live Clock */}
          <div className="flex items-center gap-2 text-right">
            <Clock className="w-4 h-4 text-slate-400 stroke-[1.5]" />
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-mono font-bold text-white tracking-wider leading-tight">
                {currentTime.time}
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 tracking-wider leading-none">
                {currentTime.date}
              </span>
            </div>
          </div>

          {/* Satellite Telemetry Widget */}
          <div className="hidden md:flex items-center gap-2.5 pl-4 border-l border-slate-700/60">
            {/* Satellite SVG */}
            <div className="relative w-8 h-8 flex items-center justify-center text-cyan-400">
              <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-cyan-400 fill-none stroke-[1.5]">
                <circle cx="12" cy="12" r="3" />
                <path d="M4 4l4 4m8 8l4 4M20 4l-4 4m-8 8l-4 4" />
                <path d="M2 12h3m14 0h3M12 2v3m0 14v3" strokeOpacity="0.4" />
              </svg>
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <div className="flex flex-col text-[9px] font-mono">
              <span className="text-slate-400 uppercase tracking-wider font-semibold">SATELLITE DATA</span>
              <span className="text-cyan-300 font-bold">22.5726° N</span>
              <span className="text-cyan-300 font-bold">88.3639° E</span>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Main Hero & Login Split Canvas */}
      <main className="relative z-10 w-full max-w-[1400px] mx-auto px-6 sm:px-12 py-4 my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
        
        {/* Left Column (Hero Content with India GIS Map overlay & Capabilities) */}
        <div className="lg:col-span-7 space-y-6 text-left relative">
          
          {/* Futuristic GIS Radar Hologram Visual */}
          <div className="relative w-full max-w-lg">
            <div className="relative flex items-center gap-5 mb-2">
              {/* Universal Geospatial Hazard Radar Graphic */}
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                {/* Radar Scan Rings */}
                <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-pulse" />
                <div className="absolute -inset-2 rounded-full border border-cyan-500/15" />
                <div className="absolute inset-2 rounded-full border border-dashed border-cyan-400/40 animate-spin" style={{ animationDuration: '20s' }} />

                {/* Concentric Radar Grid & Crosshairs */}
                <div className="w-12 h-12 rounded-full bg-cyan-950/40 border border-cyan-400/50 flex items-center justify-center relative">
                  <div className="w-6 h-6 rounded-full border border-cyan-400/30" />
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping absolute" />
                  <span className="w-2 h-2 rounded-full bg-rose-500 absolute" />
                </div>

                {/* Crosshair lines */}
                <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
                <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-cyan-400/50 to-transparent" />
              </div>

              {/* Radar Targeting Reticle Badge */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-[2px] bg-[#FF2E4D]" />
                  <span className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">
                    SMARTER INSIGHTS. SAFER TOMORROW.
                  </span>
                </div>
                <div className="text-xs font-mono text-cyan-400/90 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>GEOSPATIAL HAZARD RED ZONE GRID</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Display Headline */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08]">
              From Hazard Detection <br />
              <span className="text-white">to </span>
              <span className="text-[#FF2E4D] font-extrabold tracking-tight inline-block drop-shadow-[0_2px_20px_rgba(255,46,77,0.4)]">
                Safe Relocation.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed max-w-xl font-normal drop-shadow-sm">
              An intelligent GIS-driven platform for identifying hazard zones, understanding affected habitations and planning safer relocation.
            </p>
          </div>

          {/* 5 Feature / Capability Badges with Icons */}
          <div className="grid grid-cols-5 gap-2.5 max-w-xl pt-1">
            {[
              { label: 'Hazard Detection', icon: Shield, id: 'A' },
              { label: 'Risk Zone Mapping', icon: Compass, id: 'B' },
              { label: 'Population Analysis', icon: Users, id: 'C' },
              { label: 'Safe Zone Identification', icon: ShieldCheck, id: 'D' },
              { label: 'Relocation Planning', icon: Navigation, id: 'E' },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div 
                  key={idx}
                  className="bg-[#0B1528]/80 border border-slate-700/60 rounded-xl p-2 sm:p-2.5 flex flex-col items-center justify-center text-center backdrop-blur-md hover:border-cyan-500/50 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/70 flex items-center justify-center text-cyan-400 group-hover:text-white group-hover:bg-[#E11D48] transition-colors mb-1.5 shadow-inner">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-medium text-slate-300 leading-tight">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Live Status Badge */}
          <div className="flex items-center gap-2 pt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-950/60 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300">
              Disaster Intelligence Platform
            </span>
          </div>

          {/* Bottom Left & Center Metadata Area */}
          <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 max-w-xl">
            {/* Cursive Resilience Slogan */}
            <div className="space-y-1">
              <div 
                className="text-2xl sm:text-3xl text-slate-200 tracking-wide font-serif italic"
                style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
              >
                Safer Communities, <br />
                <span className="text-white font-bold">Stronger Resilience</span>
              </div>
              {/* Emergency Signal Line Accent */}
              <div className="flex items-center h-1 w-32 rounded-full overflow-hidden mt-1 shadow-sm bg-gradient-to-r from-[#E11D48] via-cyan-400 to-emerald-400" />
            </div>

            {/* Baseline Census & GIS Stats Card */}
            <div className="bg-[#0B1528]/85 border border-slate-700/70 rounded-xl p-3 backdrop-blur-md flex items-center gap-4 text-xs font-mono shadow-lg">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">COVERAGE</span>
                <div className="flex items-center gap-1.5 text-white font-extrabold text-sm">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span>28,389+</span>
                </div>
                <span className="text-[9px] text-slate-400 block">Habitation Records</span>
              </div>

              <div className="h-8 w-px bg-slate-700" />

              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-[10px] text-slate-300 font-semibold">GIS Baseline Dataset</div>
                  <div className="w-16 h-1 bg-cyan-500/40 rounded-full mt-1 overflow-hidden">
                    <div className="w-3/4 h-full bg-cyan-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Authentication Card & Role Selector */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Main Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="bg-[#0B1528]/90 border border-slate-700/80 rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl text-slate-100 relative"
          >
            {/* Card Header with ResQZone Logo */}
            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-800">
              <img
                src="/assets/logo/resqzone-symbol.svg"
                alt="RESQZONE"
                className="w-8 h-8 object-contain shrink-0 drop-shadow-md"
                loading="eager"
              />
              <div>
                <div className="text-sm font-black font-mono tracking-wider text-white leading-none">
                  RES<span className="text-[#FF2E4D]">Q</span><span className="text-[#FF2E4D]">Z</span>ONE
                </div>
                <div className="text-[9px] text-slate-300 tracking-tight leading-none mt-1 font-medium">
                  Intelligent Hazard Red Zone &amp; Relocation System
                </div>
              </div>
            </div>

            {/* Welcome Back Title */}
            <div className="text-left mb-4">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {authMode === 'LOGIN' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {authMode === 'LOGIN' ? 'Sign in to access your dashboard' : 'Register to access emergency disaster network'}
              </p>
            </div>

            {/* Email Login vs Google Login Tabs */}
            <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-[#070D18]/90 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('EMAIL')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'EMAIL'
                    ? 'bg-blue-600/30 border border-blue-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>Email Login</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('GOOGLE');
                  handleGoogleAuthClick();
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'GOOGLE'
                    ? 'bg-blue-600/30 border border-blue-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google Login</span>
              </button>
            </div>

            {/* Inline Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5 text-left">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Email Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3.5 text-left">
              
              {/* Full Name for Registration */}
              {authMode === 'REGISTER' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                      className="w-full bg-[#070D18]/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    autoComplete="email"
                    className="w-full bg-[#070D18]/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete={authMode === 'REGISTER' ? 'new-password' : 'current-password'}
                    className="w-full bg-[#070D18]/90 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-200 transition-colors p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password for Register */}
              {authMode === 'REGISTER' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirm Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                      autoComplete="new-password"
                      className="w-full bg-[#070D18]/90 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-200 transition-colors p-0.5 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-sm bg-slate-900 border-slate-700 text-rose-600 focus:ring-rose-500"
                  />
                  <span>Remember me</span>
                </label>

                {authMode === 'LOGIN' && (
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setShowForgotPassword(true);
                      setResetFeedback(null);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              {/* Primary Sign In Button (Red Gradient) */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#E11D48] to-[#BE123C] hover:from-[#F43F5E] hover:to-[#E11D48] active:from-[#BE123C] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 transition-all cursor-pointer disabled:opacity-60 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>AUTHENTICATING...</span>
                  </>
                ) : successState ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>AUTHENTICATED</span>
                  </>
                ) : (
                  <>
                    <span>{authMode === 'LOGIN' ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* OR Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">OR</span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>

            {/* Continue with Google White Button */}
            <button
              type="button"
              onClick={handleGoogleAuthClick}
              disabled={googleLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer disabled:opacity-60"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            {/* Footer Prompt */}
            <div className="mt-4 pt-3 border-t border-slate-800 text-center">
              <span className="text-[11px] text-slate-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setShowContactAdmin(true)}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors cursor-pointer"
                >
                  Contact Administrator
                </button>
              </span>
            </div>
          </motion.div>

          {/* Select Your Role Card (Directly Below Login Card) */}
          <div className="bg-[#0B1528]/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl text-left">
            <div className="mb-3">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Select Your Role
              </h3>
              <p className="text-[11px] text-slate-400">
                Choose how you want to use ResQZone
              </p>
            </div>

            {/* Two Side-by-Side Photo-Backed Role Cards */}
            <div className="grid grid-cols-2 gap-3">
              
              {/* Role 1: Citizen Card */}
              <div 
                onClick={() => {
                  setSelectedRole('CITIZEN');
                  onQuickDemo('CITIZEN');
                }}
                className={`group relative rounded-xl overflow-hidden border p-3 flex flex-col justify-between h-28 cursor-pointer transition-all duration-200 ${
                  selectedRole === 'CITIZEN'
                    ? 'border-cyan-500 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-950/50'
                    : 'border-slate-700 hover:border-slate-500'
                }`}
              >
                {/* Background Image */}
                <img
                  src={IMAGES.citizenEvac}
                  alt="Citizen Flood Rescue"
                  className="absolute inset-0 w-full h-full object-cover brightness-[0.38] group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1528] via-[#0B1528]/60 to-transparent" />

                {/* Top Badge */}
                <div className="relative z-10 flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/30 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
                    <Users className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-bold text-white">Citizen</span>
                </div>

                {/* Bottom Description & Arrow */}
                <div className="relative z-10 flex items-end justify-between">
                  <p className="text-[10px] text-slate-300 leading-tight pr-2">
                    Report hazards. Find safety. Request assistance.
                  </p>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
              </div>

              {/* Role 2: Authority Card */}
              <div 
                onClick={() => {
                  setSelectedRole('AUTHORITY');
                  onQuickDemo('AUTHORITY');
                }}
                className={`group relative rounded-xl overflow-hidden border p-3 flex flex-col justify-between h-28 cursor-pointer transition-all duration-200 ${
                  selectedRole === 'AUTHORITY'
                    ? 'border-rose-500 ring-2 ring-rose-500/40 shadow-lg shadow-rose-950/50'
                    : 'border-slate-700 hover:border-slate-500'
                }`}
              >
                {/* Background Image */}
                <img
                  src={IMAGES.commandCenter}
                  alt="Authority Operations Control"
                  className="absolute inset-0 w-full h-full object-cover brightness-[0.38] group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1528] via-[#0B1528]/60 to-transparent" />

                {/* Top Badge */}
                <div className="relative z-10 flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-rose-500/30 border border-rose-400/50 flex items-center justify-center text-rose-300">
                    <Shield className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-bold text-white">Authority</span>
                </div>

                {/* Bottom Description & Arrow */}
                <div className="relative z-10 flex items-end justify-between">
                  <p className="text-[10px] text-slate-300 leading-tight pr-2">
                    Monitor risk. Analyze impact. Plan relocation.
                  </p>
                  <ArrowRight className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
              </div>

            </div>
          </div>

        </div>

      </main>

      {/* 4. Far Bottom-Right: Live Monitoring Legend Widget */}
      <div className="fixed bottom-4 right-6 z-30 hidden sm:flex flex-col gap-1.5 bg-[#0B1528]/90 border border-slate-700/80 rounded-xl p-3 backdrop-blur-md shadow-2xl text-[10px] font-mono text-left">
        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">
          LIVE MONITORING
        </span>
        <div className="flex items-center gap-2 text-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Weather</span>
        </div>
        <div className="flex items-center gap-2 text-slate-200">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>Hazard Zones</span>
        </div>
        <div className="flex items-center gap-2 text-slate-200">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>Population</span>
        </div>
        <div className="flex items-center gap-2 text-slate-200">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Infrastructure</span>
        </div>
      </div>

      {/* 5. Google Custom Modal for direct linking */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full text-left space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <h3 className="text-base font-bold text-white">Sign in with Google</h3>
              </div>
              <button 
                onClick={() => setShowGoogleModal(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Confirm your Google Account details to link your ResQZone identity with role: <span className="font-bold text-white uppercase">{selectedRole}</span>.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Google Account Name
                </label>
                <input
                  type="text"
                  value={googleCustomName}
                  onChange={(e) => setGoogleCustomName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Google Email Address
                </label>
                <input
                  type="email"
                  value={googleCustomEmail}
                  onChange={(e) => setGoogleCustomEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectGoogleAuth(googleCustomName, googleCustomEmail)}
                  className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-100 text-xs font-bold text-slate-900 transition-colors flex items-center justify-center gap-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* 6. Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full text-left space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Reset Password</h3>
              <button onClick={() => setShowForgotPassword(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Enter your email to receive a password recovery link.
            </p>
            {resetFeedback && (
              <div className={`p-3 rounded-xl text-xs ${resetFeedback.type === 'success' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/15 text-rose-300 border border-rose-500/40'}`}>
                {resetFeedback.text}
              </div>
            )}
            <form onSubmit={handleResetPassword} className="space-y-3">
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-2.5 rounded-xl bg-[#E11D48] hover:bg-rose-600 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {resetLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 7. Contact Admin Modal */}
      {showContactAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full text-left space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white">ResQZone Operations Desk</h3>
              <button onClick={() => setShowContactAdmin(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              For administrative credential provisioning, authority badge registration, or sector coordination support, contact:
            </p>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5 text-slate-300">
              <div>Email: <span className="text-cyan-400 font-bold">ops-duty@resqzone.org</span></div>
              <div>Emergency Hotline: <span className="text-rose-400 font-bold">112 / +91 11 2670 1700</span></div>
              <div>Operating Status: <span className="text-emerald-400 font-bold">24x7 EOC Active</span></div>
            </div>
            <button
              onClick={() => setShowContactAdmin(false)}
              className="w-full py-2 rounded-xl bg-slate-800 text-white text-xs font-bold cursor-pointer hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
