import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, Eye, EyeOff, Clock, Lock, Mail, Phone, Timer } from 'lucide-react';
import { auth, db, isFirebaseConfigured } from '../../firebase';

interface LoginFormProps {
  onToggleMode: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode }) => {
  const { login, loginWithPhone, loginWithGoogle } = useAuth();
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const sendOTP = async (phoneNumber: string) => {
    if (!phoneNumber.trim()) return;
    
    setOtpLoading(true);
    setError('');
    
    // Simulate API delay
    setTimeout(() => {
      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOTP(otp);
      setOtpSent(true);
      setOtpLoading(false);
      
      // For demo purposes, we'll also set the verification code automatically after 2 seconds
      setTimeout(() => {
        setVerificationCode(otp);
      }, 2000);
    }, 1500);
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    setOtpSent(false);
    setGeneratedOTP('');
    setVerificationCode('');
    setError('');
    
    // Auto-send OTP when phone number looks complete
    if (value.length >= 10) {
      sendOTP(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (loginMethod === 'email') {
        await login(email, password);
      } else {
        await loginWithPhone(phone, verificationCode);
      }
    } catch (err: any) {
      // Normalize Firebase auth errors
      const msg = typeof err?.message === 'string' ? err.message : 'Authentication failed';
      const code = (err?.code as string) || '';
      // Common Firebase email/password errors
      if (code === 'auth/user-not-found') {
        setError('No account found for this email. Please register first.');
      } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Incorrect password. Please try again.');
      } else if (code === 'auth/invalid-email') {
        setError('Invalid email format.');
      } else if (msg.includes('auth/operation-not-allowed')) {
        setError('Sign-in method is disabled in Firebase Auth. Enable it in Firebase Console > Authentication > Sign-in method.');
      } else if (msg.includes('auth/popup-blocked')) {
        setError('Popup blocked by the browser. Allow popups for this site or try again.');
      } else if (msg.includes('auth/popup-closed-by-user')) {
        setError('The sign-in popup was closed before completing. Please try again.');
      } else if (msg.includes('auth/invalid-api-key') || msg.includes('auth/api-key-not-valid')) {
        setError('Invalid or restricted Firebase API key. Verify VITE_FIREBASE_API_KEY in .env.local matches your Firebase Web App config.');
      } else if (msg.includes('Firebase: Error (auth/')) {
        setError(msg.replace('Firebase: Error ', ''));
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Clock-Themed Login Design ---
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Clock Faces */}
      {[...Array(8)].map((_, i) => (
        <div 
          key={i}
          className="absolute w-32 h-32 border-2 border-white/10 rounded-full animate-spin opacity-20"
          style={{
            left: `${10 + (i % 4) * 25}%`,
            top: `${20 + Math.floor(i / 4) * 60}%`,
            animationDuration: `${20 + i * 5}s`,
            animationDirection: i % 2 === 0 ? 'normal' : 'reverse'
          }}
        >
          {/* Clock markings */}
          {[...Array(12)].map((_, mark) => (
            <div
              key={mark}
              className="absolute w-0.5 h-4 bg-white/20"
              style={{
                left: '50%',
                top: '0',
                transformOrigin: '50% 64px',
                transform: `translateX(-50%) rotate(${mark * 30}deg)`
              }}
            />
          ))}
          {/* Clock hands */}
          <div 
            className="absolute w-0.5 h-8 bg-blue-400/60 origin-bottom"
            style={{
              left: '50%',
              top: '50%',
              transformOrigin: '50% 100%',
              transform: `translateX(-50%) translateY(-100%) rotate(${(currentTime.getHours() % 12) * 30 + currentTime.getMinutes() * 0.5}deg)`
            }}
          />
          <div 
            className="absolute w-0.5 h-12 bg-blue-300/80 origin-bottom"
            style={{
              left: '50%',
              top: '50%',
              transformOrigin: '50% 100%',
              transform: `translateX(-50%) translateY(-100%) rotate(${currentTime.getMinutes() * 6}deg)`
            }}
          />
        </div>
      ))}
      
      {/* Floating Time Elements */}
      {[...Array(15)].map((_, i) => (
        <div 
          key={i}
          className="absolute text-white/10 font-mono text-sm animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${4 + Math.random() * 3}s`
          }}
        >
          {Math.floor(Math.random() * 24).toString().padStart(2, '0')}:{Math.floor(Math.random() * 60).toString().padStart(2, '0')}
        </div>
      ))}
      
      {/* Digital Clock Display - Top */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-black/30 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/20">
        <div className="text-center">
          <div className="text-2xl font-mono text-blue-300 font-bold">
            {currentTime.toLocaleTimeString()}
          </div>
          <div className="text-sm text-white/60 mt-1">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto p-8 bg-black/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        {/* Clock-themed Header Background */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-blue-900/30 via-indigo-800/30 to-slate-800/30 rounded-t-3xl -z-10" />
        
        {/* Animated Clock Icon */}
        <div className="flex flex-col items-center mb-8 relative">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg mb-2 relative border-4 border-white/20">
              <Clock className="w-12 h-12 text-white animate-pulse" />
              {/* Clock hands overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className="absolute w-0.5 h-6 bg-white/80 origin-bottom"
                  style={{
                    transformOrigin: '50% 90%',
                    transform: `rotate(${(currentTime.getHours() % 12) * 30 + currentTime.getMinutes() * 0.5}deg)`
                  }}
                />
                <div 
                  className="absolute w-0.5 h-8 bg-white/60 origin-bottom"
                  style={{
                    transformOrigin: '50% 90%',
                    transform: `rotate(${currentTime.getMinutes() * 6}deg)`
                  }}
                />
              </div>
              {/* Glowing ring effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 animate-ping opacity-20" />
            </div>
            {/* Floating timer icon */}
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center animate-bounce shadow-lg">
              <Timer className="w-4 h-4 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mt-2 mb-1 tracking-tight text-center drop-shadow-lg">
            TimeBank
          </h2>
          <p className="text-white/80 text-center text-base font-medium">Every moment counts • Exchange skills in time ⏰</p>
          {/* Backend status badge */}
          <div className="mt-2">
            <span className={`text-xs px-2 py-1 rounded border ${isFirebaseConfigured() && auth && db ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' : 'bg-yellow-500/20 text-yellow-200 border-yellow-400/40'}`}>
              Backend: {isFirebaseConfigured() && auth && db ? 'Firebase' : 'Local'}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && !error.includes('auth/api-key-not-valid') && (
          <div className="mb-6 p-4 bg-red-900/30 backdrop-blur-sm border-2 border-red-400/50 rounded-xl text-red-300 text-sm animate-shake">
            {error}
          </div>
        )}

        {/* Quick Demo Login Section */}
        <div className="mb-8 p-6 bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border-2 border-blue-400/30 rounded-xl shadow-md backdrop-blur-sm relative overflow-hidden">
          {/* Decorative time elements */}
          <div className="absolute top-2 right-2 w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
          <div className="absolute bottom-2 left-2 w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
          <div className="absolute top-4 left-4 text-xs text-white/30 font-mono">
            {currentTime.getSeconds().toString().padStart(2, '0')}s
          </div>
          
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-blue-300 flex items-center justify-center gap-2">
              <div className="relative">
                <Clock className="w-5 h-5 animate-spin" style={{animationDuration: '2s'}} />
                <div className="absolute inset-0 animate-ping">
                  <Clock className="w-5 h-5 opacity-20" />
                </div>
              </div>
              Quick Access
            </h3>
            <p className="text-sm text-blue-200 mt-2 font-medium">Save time • Login instantly</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Google Sign-In */}
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                try {
                  await loginWithGoogle();
                } catch (err: any) {
                  setError(err.message);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="p-5 bg-white/10 border-2 border-red-400/50 rounded-xl hover:border-red-400 hover:bg-red-500/20 transition-all duration-300 group disabled:opacity-50 hover:shadow-xl hover:shadow-red-500/30 transform hover:scale-105 active:scale-95 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="w-14 h-14 bg-red-500/20 border border-red-400/50 rounded-full flex items-center justify-center relative">
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="text-red-300 font-bold text-xl">G</span>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-pulse" />
                    </>
                  )}
                </div>
                <div className="text-center">
                  <p className="font-semibold text-red-300 text-lg">Google OAuth</p>
                  <p className="text-sm text-red-200/80 mt-1">Instant access</p>
                </div>
              </div>
            </button>
            {/* Demo User */}
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                try {
                  await login('demo@timebank.com', 'demo123');
                } catch (err: any) {
                  setError(err.message);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="p-5 bg-white/10 border-2 border-blue-400/50 rounded-xl hover:border-blue-400 hover:bg-blue-500/20 transition-all duration-300 group disabled:opacity-50 hover:shadow-xl hover:shadow-blue-500/30 transform hover:scale-105 active:scale-95 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="w-14 h-14 bg-blue-500/20 border border-blue-400/50 rounded-full flex items-center justify-center relative">
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                  ) : (
                    <>
                      <Timer className="w-8 h-8 text-blue-300" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                    </>
                  )}
                </div>
                <div className="text-center">
                  <p className="font-semibold text-blue-300 text-lg">Demo Mode</p>
                  <p className="text-sm text-blue-200/80 mt-1">Try it now</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Divider with Time */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-black/20 text-white/70 flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Or take your time
            </span>
          </div>
        </div>

        {/* Gmail Support Info */}
        <div className="mb-6 p-4 bg-blue-900/30 border border-blue-400/30 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-2 text-blue-300">
            <Mail className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium">Gmail Integration</span>
            <div className="ml-auto text-xs text-blue-200/60 font-mono">
              {currentTime.toLocaleTimeString('en-US', { hour12: false })}
            </div>
          </div>
          <p className="text-xs text-blue-200/80 mt-1">
            Any Gmail account • 6+ character password • Instant access
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex bg-white/5 backdrop-blur-sm rounded-lg p-1 mb-6 border border-white/10">
            <button type="button" className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${loginMethod === 'email' ? 'bg-white/20 text-blue-300 shadow-sm border border-white/20' : 'text-white/60 hover:text-white/80'}`}
              onClick={() => setLoginMethod('email')}
            >
              <Mail className="w-4 h-4" />Email
            </button>
            <button type="button" className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${loginMethod === 'phone' ? 'bg-white/20 text-blue-300 shadow-sm border border-white/20' : 'text-white/60 hover:text-white/80'}`}
              onClick={() => setLoginMethod('phone')}
            >
              <Phone className="w-4 h-4" />Phone
            </button>
          </div>
          {loginMethod === 'email' && (
            <>
              <div className="relative">
                <label htmlFor="email" className={`block text-sm font-medium mb-2 transition-colors ${focusedField === 'email' ? 'text-blue-300' : 'text-white/70'}`}>Email Address</label>
                <div className="relative group">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${focusedField === 'email' ? 'text-blue-400' : 'text-white/40'}`} />
                  <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} placeholder="Enter your Gmail or demo account" className="w-full pl-12 pr-4 py-3.5 bg-white/10 border-2 border-white/20 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all duration-300 hover:border-white/30 text-white placeholder-white/50 backdrop-blur-sm" required />
                  <div className={`absolute inset-0 rounded-xl pointer-events-none transition-opacity ${focusedField === 'email' ? 'opacity-100' : 'opacity-0'}`} style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' }} />
                </div>
              </div>
              <div className="relative">
                <label htmlFor="password" className={`block text-sm font-medium mb-2 transition-colors ${focusedField === 'password' ? 'text-blue-300' : 'text-white/70'}`}>Password</label>
                <div className="relative group">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${focusedField === 'password' ? 'text-blue-400' : 'text-white/40'}`} />
                  <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} placeholder="Enter your password" className="w-full pl-12 pr-12 py-3.5 bg-white/10 border-2 border-white/20 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all duration-300 hover:border-white/30 text-white placeholder-white/50 backdrop-blur-sm" required />
                  <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-blue-400 transition-colors" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <div className={`absolute inset-0 rounded-xl pointer-events-none transition-opacity ${focusedField === 'password' ? 'opacity-100' : 'opacity-0'}`} style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' }} />
                </div>
              </div>
            </>
          )}
          {loginMethod === 'phone' && (
            <>
              <div className="relative">
                <label htmlFor="phone" className={`block text-sm font-medium mb-2 transition-colors ${focusedField === 'phone' ? 'text-blue-300' : 'text-white/70'}`}>Phone Number</label>
                <div className="relative group">
                  <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${focusedField === 'phone' ? 'text-blue-400' : 'text-white/40'}`} />
                  <input id="phone" type="tel" value={phone} onChange={e => handlePhoneChange(e.target.value)} onFocus={() => setFocusedField('phone')} onBlur={() => setFocusedField(null)} placeholder="+1-555-DEMO" className="w-full pl-12 pr-4 py-3.5 bg-white/10 border-2 border-white/20 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all duration-300 hover:border-white/30 text-white placeholder-white/50 backdrop-blur-sm" required />
                  <div className={`absolute inset-0 rounded-xl pointer-events-none transition-opacity ${focusedField === 'phone' ? 'opacity-100' : 'opacity-0'}`} style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' }} />
                </div>
                {/* OTP Status Display */}
                {phone.length >= 10 && (
                  <div className="mt-2 text-sm">
                    {otpLoading && (
                      <div className="flex items-center gap-2 text-blue-300">
                        <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                        <span>Sending OTP...</span>
                        <div className="ml-auto text-xs text-white/50 font-mono">
                          {currentTime.getSeconds()}s
                        </div>
                      </div>
                    )}
                    {otpSent && !otpLoading && (
                      <div className="flex items-center gap-2 text-green-300">
                        <Timer className="w-4 h-4 animate-pulse" />
                        <span>OTP sent to {phone}</span>
                        {generatedOTP && (
                          <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-300 rounded font-mono text-xs border border-green-400/30">
                            {generatedOTP}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="relative">
                <label htmlFor="verificationCode" className={`block text-sm font-medium mb-2 transition-colors ${focusedField === 'verificationCode' ? 'text-blue-300' : 'text-white/70'}`}>Verification Code</label>
                <div className="relative group">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${focusedField === 'verificationCode' ? 'text-blue-400' : 'text-white/40'}`} />
                  <input id="verificationCode" type="text" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} onFocus={() => setFocusedField('verificationCode')} onBlur={() => setFocusedField(null)} placeholder={otpSent ? "Enter OTP or wait for auto-fill..." : "Enter OTP"} className={`w-full pl-12 pr-4 py-3.5 bg-white/10 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all duration-300 hover:border-white/30 text-white placeholder-white/50 backdrop-blur-sm ${verificationCode === generatedOTP && generatedOTP ? 'border-green-400 bg-green-500/10' : 'border-white/20'}`} required />
                  <div className={`absolute inset-0 rounded-xl pointer-events-none transition-opacity ${focusedField === 'verificationCode' ? 'opacity-100' : 'opacity-0'}`} style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' }} />
                </div>
                {/* OTP Auto-fill Status */}
                {verificationCode === generatedOTP && generatedOTP && (
                  <div className="mt-2 text-sm text-green-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-400 animate-pulse" />
                    <span>Code verified • Ready to proceed</span>
                  </div>
                )}
              </div>
            </>
          )}
          <button
            type="submit"
            disabled={loading}
            className="relative w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] mt-2 border border-white/20"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            {/* Animated shine effect */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
            {/* Clock ticking indicator */}
            <div className="absolute top-2 right-2 text-xs text-white/60 font-mono">
              {currentTime.getSeconds().toString().padStart(2, '0')}
            </div>
            <span className="relative flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5 group-hover:animate-pulse" />
                  Enter TimeBank
                </>
              )}
            </span>
          </button>
        </form>
        <div className="mt-6 text-center">
          <button type="button" onClick={onToggleMode} className="text-blue-300 hover:text-blue-200 hover:underline font-medium transition flex items-center justify-center gap-2 mx-auto">
            <Timer className="w-4 h-4" />
            New user? Register now
          </button>
        </div>
      </div>
      {/* Clock-themed Custom Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-15px) rotate(5deg); opacity: 0.8; }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        
        @keyframes clock-tick {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(6deg); }
        }
        .animate-clock-tick { animation: clock-tick 1s ease-in-out infinite; }
        
        @keyframes time-glow {
          0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.6), 0 0 30px rgba(79, 70, 229, 0.4); }
        }
        .animate-time-glow { animation: time-glow 2s ease-in-out infinite; }
        
        @keyframes digital-flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-digital-flicker { animation: digital-flicker 0.1s ease-in-out infinite; }
          background-size: 200% 200%;
          animation: gradient-text 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};