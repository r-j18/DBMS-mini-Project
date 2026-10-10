import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Lock, User, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Stamp } from '../components/common/Stamp';
import { PushPin } from '../components/common/PushPin';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated, redirect
  useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Username and password are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await login(username.trim(), password);
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid username or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EFE9DC] dark:bg-[#141D27] flex flex-col justify-center items-center p-4 relative overflow-hidden paper-texture">
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-3 dark:opacity-5 pointer-events-none select-none">
        <Shield size={600} className="text-[#1F1F1F] dark:text-[#E2DFD8]" />
      </div>

      {/* Manila Dossier Card */}
      <div className="relative w-full max-w-md bg-[#FAF7F0] dark:bg-[#1E2024] border-2 border-[#D8D2C2] dark:border-[#383C45] rounded-xs p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Top Pushpin */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <PushPin color="brass" size={26} />
        </div>

        {/* Bureau Header */}
        <div className="text-center space-y-1.5 pt-1 border-b border-[#D8D2C2] dark:border-[#383C45] pb-5">
          <div className="flex justify-center mb-2">
            <div className="h-10 w-10 rounded-full bg-[#1F2D3D] flex items-center justify-center border border-[#B08D3C]/60 shadow-xs">
              <Shield size={20} className="text-[#B08D3C]" />
            </div>
          </div>
          <h1 className="font-typewriter text-base sm:text-lg font-bold tracking-wider text-[#1F1F1F] dark:text-[#E2DFD8] uppercase">
            Criminal Records Bureau
          </h1>
          <p className="font-mono text-[10px] sm:text-[11px] text-[#B08D3C] uppercase tracking-widest font-semibold">
            Authorized Personnel Only // Form CRB-AUTH
          </p>
        </div>

        {/* Error Feedback with Stamp Slam */}
        {errorMessage && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-[#B3261E]/40 rounded-xs space-y-2 text-center">
            <div className="flex justify-center">
              <Stamp text="ACCESS DENIED" variant="classified" size="sm" animateSlam rotateDeg={-2} />
            </div>
            <p className="font-typewriter text-xs text-[#B3261E] dark:text-red-400">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block font-typewriter text-xs font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase">
              Badge / Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7A7A7A]">
                <User size={15} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
                placeholder="Enter bureau username"
                className="w-full pl-9 pr-3 py-2 bg-[#FAF7F0] dark:bg-[#252830] border border-[#D8D2C2] dark:border-[#383C45] rounded-xs font-typewriter text-xs sm:text-sm text-[#1F1F1F] dark:text-[#E2DFD8] placeholder:text-[#A09D95] focus:outline-none focus:border-[#B08D3C] transition-fast disabled:opacity-50"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-typewriter text-xs font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase">
              Clearance Passcode
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7A7A7A]">
                <Lock size={15} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                placeholder="Enter password"
                className="w-full pl-9 pr-9 py-2 bg-[#FAF7F0] dark:bg-[#252830] border border-[#D8D2C2] dark:border-[#383C45] rounded-xs font-typewriter text-xs sm:text-sm text-[#1F1F1F] dark:text-[#E2DFD8] placeholder:text-[#A09D95] focus:outline-none focus:border-[#B08D3C] transition-fast disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#7A7A7A] hover:text-[#1F1F1F] dark:hover:text-white"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#1F2D3D] hover:bg-[#141D27] text-[#EFE9DC] font-typewriter text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xs flex items-center justify-center gap-2 shadow-md transition-fast disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin text-[#B08D3C]" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>SIGN IN TO CENTRAL ARCHIVES</span>
                  <ArrowRight size={15} className="text-[#B08D3C]" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer Notice */}
        <div className="pt-3 border-t border-[#D8D2C2] dark:border-[#383C45] text-center">
          <p className="font-mono text-[10px] text-[#7A7A7A] uppercase leading-relaxed">
            All system access attempts are monitored and recorded to the immutable audit trail.
          </p>
        </div>
      </div>
    </div>
  );
};
