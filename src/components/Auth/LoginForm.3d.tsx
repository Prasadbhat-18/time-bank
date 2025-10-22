import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Clock, Lock, Mail, Timer } from 'lucide-react';
import { ResetPasswordModal } from './ResetPasswordModal';

export default function LoginForm({ onToggleMode }: { onToggleMode: () => void }) {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cardTilt, setCardTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((y - centerY) / centerY) * -5;
    const tiltY = ((x - centerX) / centerX) * 5;
    setCardTilt({ x: tiltX, y: tiltY });
  };
  const handleMouseLeave = () => setCardTilt({ x: 0, y: 0 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => setShowReset(true);

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden px-4 py-6 md:py-8">
      {/* Background and floating elements omitted for brevity, keep as in your file */}
      {/* ... (keep your background, clocks, particles, gears, etc. as in your file) ... */}

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md mx-auto mt-24 md:mt-0">
        <div
          className="relative p-6 sm:p-7 md:p-8 bg-gradient-to-br from-slate-900/85 via-indigo-900/85 to-purple-900/85 backdrop-blur-2xl rounded-3xl border-2 border-cyan-500/40 overflow-hidden transition-transform duration-300 ease-out"
          style={{
            boxShadow: `
              0 0 100px rgba(34, 211, 238, 0.35),
              0 25px 70px rgba(0, 0, 0, 0.6),
              inset 0 0 80px rgba(34, 211, 238, 0.08),
              inset 0 2px 0 rgba(255, 255, 255, 0.1)
            `,
            transform: `perspective(1000px) rotateX(${cardTilt.x}deg) rotateY(${cardTilt.y}deg) translateZ(20px)`,
            transformStyle: 'preserve-3d'
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Branding */}
          <div className="flex flex-col items-center mb-7 md:mb-9 relative z-10">
            <div className="relative mb-4">
              <div className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-cyan-300 via-blue-500 to-indigo-700 rounded-full flex items-center justify-center shadow-2xl mb-3 relative border-4 border-cyan-400/60 transition-all hover:scale-110 duration-500 animate-float group">
                <Clock className="w-12 h-12 md:w-14 md:h-14 text-white drop-shadow-2xl group-hover:animate-spin" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 animate-ping opacity-20" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-orange-400 via-red-500 to-pink-600 rounded-full flex items-center justify-center animate-pulse shadow-2xl border-3 border-white"
                style={{
                  boxShadow: '0 0 40px rgba(251, 146, 60, 0.9), 0 5px 20px rgba(0, 0, 0, 0.5)'
                }}>
                <Timer className="w-5 h-5 md:w-6 md:h-6 text-white drop-shadow-lg" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-cyan-200 via-blue-300 to-cyan-400 bg-clip-text text-transparent mt-2 mb-3 tracking-tight text-center relative"
              style={{
                textShadow: '0 0 60px rgba(34, 211, 238, 0.6)',
                WebkitTextStroke: '1px rgba(34, 211, 238, 0.3)'
              }}>
              TIMEBANK
            </h1>
            <div className="relative mb-3">
              <p className="text-cyan-300 text-base md:text-lg font-bold tracking-widest text-center relative z-10"
                style={{
                  textShadow: '0 0 20px rgba(34, 211, 238, 0.8), 0 0 40px rgba(34, 211, 238, 0.4)'
                }}>
                Exchange Time. Not Money.
              </p>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"
                style={{ boxShadow: '0 0 10px rgba(34, 211, 238, 0.6)' }} />
            </div>
            <p className="text-slate-300/70 text-xs md:text-sm text-center px-4">
              Barter your skills • Value through time ⏰
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 md:mb-6 p-3 md:p-4 bg-gradient-to-r from-red-900/40 to-orange-900/40 backdrop-blur-md border-2 border-red-400/60 rounded-2xl text-red-200 text-xs md:text-sm animate-shake flex items-start gap-2 md:gap-3 relative overflow-hidden"
              style={{
                boxShadow: '0 0 30px rgba(239, 68, 68, 0.3), inset 0 0 20px rgba(239, 68, 68, 0.1)'
              }}>
              <span className="flex-1 relative z-10 font-medium">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
            <div className="relative">
              <label htmlFor="email" className={`block text-sm md:text-base font-bold mb-2 md:mb-2.5 transition-colors tracking-wide ${focusedField === 'email' ? 'text-cyan-300' : 'text-cyan-400/80'}`}>Email Address</label>
              <div className="relative group">
                <Mail className={`absolute left-4 md:left-4.5 top-1/2 -translate-y-1/2 w-5 md:w-5.5 h-5 md:h-5.5 transition-colors ${focusedField === 'email' ? 'text-cyan-400' : 'text-cyan-500/50'}`} />
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} placeholder="Enter your Gmail" className="w-full pl-12 md:pl-13 pr-4 md:pr-5 py-3.5 md:py-4 bg-slate-900/50 border-2 border-cyan-500/30 rounded-xl focus:border-cyan-400 outline-none transition-all duration-300 hover:border-cyan-400/60 text-white placeholder-cyan-400/40 backdrop-blur-md text-sm md:text-base touch-manipulation font-medium" required />
              </div>
            </div>
            <div className="relative">
              <label htmlFor="password" className={`block text-sm md:text-base font-bold mb-2 md:mb-2.5 transition-colors tracking-wide ${focusedField === 'password' ? 'text-cyan-300' : 'text-cyan-400/80'}`}>Password</label>
              <div className="relative group">
                <Lock className={`absolute left-4 md:left-4.5 top-1/2 -translate-y-1/2 w-5 md:w-5.5 h-5 md:h-5.5 transition-colors ${focusedField === 'password' ? 'text-cyan-400' : 'text-cyan-500/50'}`} />
                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} placeholder="Enter your password" className="w-full pl-12 md:pl-13 pr-12 md:pr-13 py-3.5 md:py-4 bg-slate-900/50 border-2 border-cyan-500/30 rounded-xl focus:border-cyan-400 outline-none transition-all duration-300 hover:border-cyan-400/60 text-white placeholder-cyan-400/40 backdrop-blur-md text-sm md:text-base touch-manipulation font-medium" required />
                <button type="button" className="absolute right-4 md:right-4.5 top-1/2 -translate-y-1/2 text-cyan-500/50 hover:text-cyan-400 transition-colors p-1.5 touch-manipulation" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff className="w-5 md:w-5.5 h-5 md:h-5.5" /> : <Eye className="w-5 md:w-5.5 h-5 md:h-5.5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="relative w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white py-4 md:py-4.5 rounded-2xl font-bold overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] mt-3 border-2 border-cyan-400/50 touch-manipulation min-h-[56px] text-base md:text-lg tracking-wide"
            >
              {loading ? (
                <>
                  <Clock className="w-5 md:w-6 h-5 md:h-6 group-hover:animate-spin" style={{ animationDuration: '2s' }} />
                  Processing...
                </>
              ) : (
                <>
                  <Clock className="w-5 md:w-6 h-5 md:h-6 group-hover:animate-spin" style={{ animationDuration: '2s' }} />
                  Enter TimeBank
                </>
              )}
            </button>
          </form>
          <div className="flex items-center my-6">
            <hr className="flex-grow border-cyan-400/30" />
            <span className="mx-4 text-cyan-300">OR CONTINUE</span>
            <hr className="flex-grow border-cyan-400/30" />
          </div>
          <button
            type="button"
            className="w-full flex items-center justify-center py-3 rounded-xl border border-cyan-400/40 bg-[#181A20] text-white font-semibold shadow hover:bg-cyan-900 transition-colors duration-300 mb-4"
            onClick={() => loginWithGoogle()}
          >
            {/* Use your GoogleIcon here */}
            <span className="ml-2">GOOGLE ACCESS</span>
          </button>
          <div className="text-center mt-4 text-cyan-300">
            New user? <span className="text-pink-400 font-bold cursor-pointer" onClick={onToggleMode}>REGISTER ACCOUNT</span>
          </div>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm md:text-base text-cyan-400/70 hover:text-cyan-300 font-semibold transition-all touch-manipulation py-2 hover:underline decoration-cyan-400/50 underline-offset-4 inline-flex items-center gap-2 group"
          >
            <Lock className="w-4 h-4 group-hover:animate-pulse" />
            Forgot / Reset Password
          </button>
          {showReset && <ResetPasswordModal onClose={() => setShowReset(false)} />}
        </div>
      </div>
      {/* ...keep your CSS styles as in your file... */}
    </div>
  );
}