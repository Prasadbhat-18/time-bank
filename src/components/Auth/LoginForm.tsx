import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Clock, Lock, Mail, Timer, ArrowRight, Star, Zap, Shield, Award, Phone } from 'lucide-react';
import { ResetPasswordModal } from './ResetPasswordModal';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import './LoginForm.css';

interface LoginFormProps {
  onToggleMode: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode }) => {
  const { login, loginWithGoogle, loginWithPhone } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);

  // Animated features for the carousel
  const features = [
    {
      icon: Clock,
      title: "Time-Based Trading",
      description: "Every hour of service equals one time credit",
      color: "cyan",
      stat: "1 Hour = 1 Credit"
    },
    {
      icon: Timer,
      title: "Real-Time Booking",
      description: "Schedule services instantly with live availability",
      color: "blue",
      stat: "Instant Scheduling"
    },
    {
      icon: Star,
      title: "Reputation System",
      description: "Build trust with verified reviews and ratings",
      color: "purple",
      stat: "4.8★ Average Rating"
    },
    {
      icon: Zap,
      title: "Instant Matching",
      description: "Find the perfect skill exchange in seconds",
      color: "yellow",
      stat: "< 2min Match Time"
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description: "End-to-end encryption and verified profiles",
      color: "green",
      stat: "100% Secure"
    },
    {
      icon: Award,
      title: "Level Up System",
      description: "Earn XP and unlock exclusive perks",
      color: "pink",
      stat: "50+ Levels"
    }
  ];

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-slide features carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeatureIndex((prev) => (prev + 1) % features.length);
    }, 4000); // Change feature every 4 seconds
    
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (loginMethod === 'email') {
        await login(email, password);
      } else if (loginMethod === 'phone') {
        if (!verificationSent) {
          // Send OTP
          await loginWithPhone(phoneNumber, '');
          setVerificationSent(true);
        } else {
          // Verify OTP
          await loginWithPhone(phoneNumber, verificationCode);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => setShowReset(true);

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Panel - Branding & Info (40%) */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo & Branding */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold">TIMEBANK</h1>
            </div>
            
            <h2 className="text-5xl font-bold leading-tight mb-6">
              Exchange Time,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Not Money
              </span>
            </h2>
            
            <p className="text-lg text-slate-300 mb-12">
              Join thousands trading skills and services<br />
              in a time-based economy.
            </p>

            {/* Animated Features Carousel */}
            <div className="relative h-72 overflow-hidden rounded-3xl">
              {/* Glow Effect Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl" />
              
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const isActive = index === currentFeatureIndex;
                const isPrev = index === (currentFeatureIndex - 1 + features.length) % features.length;
                
                let transformClass = 'translate-x-full opacity-0 scale-95';
                if (isActive) transformClass = 'translate-x-0 opacity-100 scale-100';
                if (isPrev) transformClass = '-translate-x-full opacity-0 scale-95';
                
                const colorMap: { [key: string]: string } = {
                  cyan: 'from-cyan-500/30 via-cyan-600/20 to-blue-500/30',
                  blue: 'from-blue-500/30 via-blue-600/20 to-indigo-500/30',
                  purple: 'from-purple-500/30 via-purple-600/20 to-pink-500/30',
                  yellow: 'from-yellow-500/30 via-amber-600/20 to-orange-500/30',
                  green: 'from-green-500/30 via-emerald-600/20 to-teal-500/30',
                  pink: 'from-pink-500/30 via-rose-600/20 to-purple-500/30',
                };
                
                const borderColorMap: { [key: string]: string } = {
                  cyan: 'border-cyan-400/40',
                  blue: 'border-blue-400/40',
                  purple: 'border-purple-400/40',
                  yellow: 'border-yellow-400/40',
                  green: 'border-green-400/40',
                  pink: 'border-pink-400/40',
                };
                
                const iconColorMap: { [key: string]: string } = {
                  cyan: 'text-cyan-300',
                  blue: 'text-blue-300',
                  purple: 'text-purple-300',
                  yellow: 'text-yellow-300',
                  green: 'text-green-300',
                  pink: 'text-pink-300',
                };
                
                const glowColorMap: { [key: string]: string } = {
                  cyan: 'shadow-cyan-500/50',
                  blue: 'shadow-blue-500/50',
                  purple: 'shadow-purple-500/50',
                  yellow: 'shadow-yellow-500/50',
                  green: 'shadow-green-500/50',
                  pink: 'shadow-pink-500/50',
                };

                return (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-[800ms] ease-out ${transformClass}`}
                  >
                    <div className={`h-full p-8 bg-gradient-to-br ${colorMap[feature.color]} ${borderColorMap[feature.color]} border-2 rounded-3xl backdrop-blur-2xl shadow-2xl ${isActive ? glowColorMap[feature.color] : ''} relative overflow-hidden`}>
                      {/* Animated Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-50" />
                      
                      {/* Floating Particles Effect */}
                      <div className="absolute top-4 right-4 w-20 h-20 bg-white/5 rounded-full blur-2xl animate-pulse" />
                      <div className="absolute bottom-8 left-8 w-16 h-16 bg-white/5 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
                      
                      <div className="flex flex-col h-full relative z-10">
                        {/* Icon & Title with Enhanced Styling */}
                        <div className="flex items-center gap-4 mb-6">
                          <div className="relative">
                            <div className={`absolute inset-0 ${glowColorMap[feature.color]} blur-xl opacity-60 rounded-2xl`} />
                            <div className="relative w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border-2 border-white/30 flex items-center justify-center flex-shrink-0 shadow-lg transform hover:scale-110 transition-transform duration-300">
                              <Icon className={`w-7 h-7 ${iconColorMap[feature.color]} drop-shadow-lg`} />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-white drop-shadow-lg tracking-tight">{feature.title}</h3>
                            <div className="h-1 w-12 bg-gradient-to-r from-white/60 to-transparent rounded-full mt-1" />
                          </div>
                        </div>
                        
                        {/* Description with Better Typography */}
                        <p className="text-slate-200 mb-8 text-lg leading-relaxed flex-grow font-light">
                          {feature.description}
                        </p>
                        
                        {/* Enhanced Stat Badge */}
                        <div className="inline-flex items-center gap-2 px-5 py-3 bg-white/20 backdrop-blur-xl rounded-2xl border-2 border-white/30 self-start shadow-lg hover:scale-105 transition-transform duration-300">
                          <Zap className="w-5 h-5 text-yellow-300 animate-pulse" />
                          <span className="font-bold text-white text-base drop-shadow-md">{feature.stat}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Enhanced Carousel Indicators */}
            <div className="flex items-center justify-center gap-3 mt-8">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFeatureIndex(index)}
                  className={`group relative transition-all duration-500 ${
                    index === currentFeatureIndex ? 'scale-110' : 'scale-100 hover:scale-110'
                  }`}
                  aria-label={`Go to feature ${index + 1}`}
                >
                  {/* Indicator Glow */}
                  {index === currentFeatureIndex && (
                    <div className="absolute inset-0 bg-cyan-400/30 blur-md rounded-full animate-pulse" />
                  )}
                  
                  {/* Indicator Dot */}
                  <div className={`relative rounded-full transition-all duration-500 ${
                    index === currentFeatureIndex
                      ? 'w-10 h-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 shadow-lg shadow-cyan-400/50'
                      : 'w-2.5 h-2.5 bg-white/40 group-hover:bg-white/70 group-hover:w-4'
                  }`} />
                </button>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-300 ease-linear"
                style={{ 
                  width: `${((currentFeatureIndex + 1) / features.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Live Clock */}
          <div className="mt-auto">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
              <Clock className="w-5 h-5 text-cyan-400 animate-pulse" />
              <div>
                <div className="text-2xl font-mono font-bold">
                  {currentTime.toLocaleTimeString()}
                </div>
                <div className="text-xs text-slate-400">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form (60%) */}
      <div className="w-full lg:w-3/5 bg-white flex items-center justify-center p-6 sm:p-8 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">TIMEBANK</h1>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-600">Sign in to your account to continue</p>
          </div>

          {/* Error Message */}
          {error && !error.includes('auth/api-key-not-valid') && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-red-600 text-xs font-bold">!</span>
              </div>
              <span>{error}</span>
            </div>
          )}

          {/* Login Method Toggle */}
          <div className="mb-6 p-1 bg-gray-100 rounded-xl flex">
            <button
              type="button"
              onClick={() => setLoginMethod('email')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all duration-200 ${
                loginMethod === 'email'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Mail className="w-5 h-5" />
              <span className="font-medium">Email</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMethod('phone');
                setVerificationSent(false);
                setVerificationCode('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all duration-200 ${
                loginMethod === 'phone'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Phone className="w-5 h-5" />
              <span className="font-medium">Phone</span>
            </button>
          </div>

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
            className="w-full mb-6 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center gap-3">
              <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-yellow-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <span className="font-semibold text-gray-700 group-hover:text-gray-900">
                {loading ? 'Signing in...' : 'Continue with Google'}
              </span>
            </div>
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {loginMethod === 'email' ? (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-gray-900 placeholder-gray-400"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-gray-900 placeholder-gray-400"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                  <PhoneInput
                    international
                    defaultCountry="IN"
                    value={phoneNumber}
                    onChange={(value: any) => setPhoneNumber(value)}
                    className="w-full pl-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-gray-900"
                    placeholder="Enter phone number"
                  />
                </div>

                {verificationSent && (
                  <div className="mt-4">
                    <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                      Verification code
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="code"
                        type="text"
                        value={verificationCode}
                        onChange={e => setVerificationCode(e.target.value)}
                        placeholder="Enter 6-digit code"
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-gray-900 placeholder-gray-400"
                        required
                        maxLength={6}
                        pattern="[0-9]*"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              id="sign-in-button"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30 group"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {loginMethod === 'phone' && !verificationSent ? 'Sending code...' : 'Signing in...'}
                  </>
                ) : (
                  <>
                    {loginMethod === 'phone' && !verificationSent ? 'Send Code' : 'Sign in'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-8 space-y-4">
            {loginMethod === 'email' && (
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-cyan-600 hover:text-cyan-700 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <div className="pt-6 border-t border-gray-200">
              <div className="text-center">
                <span className="text-gray-600">Don't have an account? </span>
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="text-cyan-600 hover:text-cyan-700 font-semibold transition-colors"
                >
                  Create account
                </button>
              </div>
            </div>
          </div>

          {/* Gmail Notice */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Gmail Integration</p>
                <p className="text-blue-700">Any Gmail account • 6+ character password • Instant access</p>
              </div>
            </div>
          </div>

          {/* Footer - Copyright & Official Tags */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="space-y-3">
              {/* Official Website Badge */}
              <div className="flex items-center justify-center gap-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-cyan-900">Official Website</span>
                </div>
              </div>

              {/* Copyright Notice */}
              <div className="text-center text-sm text-gray-600">
                <p>© {new Date().getFullYear()} TimeBank. All rights reserved.</p>
                <p className="text-xs text-gray-500 mt-1">
                  Secure • Time-Based Economy • Community Driven
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showReset && <ResetPasswordModal onClose={() => setShowReset(false)} />}
    </div>
  );
};
