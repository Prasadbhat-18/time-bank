import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserPlus, Sparkles } from 'lucide-react';

interface RegisterFormProps {
  onToggleMode: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleMode }) => {
  const { register, loginWithGoogle } = useAuth();
  const [registrationMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  // Phone registration disabled for now
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // const [verificationCode] = useState('');
  // Future phone OTP flow placeholders
  // const [generatedOTP, setGeneratedOTP] = useState('');
  // const [otpSent, setOtpSent] = useState(false);
  // const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // const handlePhoneChange = (value: string) => {
  //   setPhone(value);
  //   setOtpSent(false);
  //   setGeneratedOTP('');
  //   setVerificationCode('');
  //   setError('');
  //   if (value.length >= 10) {
  //     sendOTP(value);
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (registrationMethod === 'email') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }

    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    setLoading(true);

    try {
      await register(email, password, username);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-2xl shadow-xl">
      <div className="flex items-center justify-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
          <UserPlus className="w-6 h-6 text-white" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Join TimeBank</h2>
      <p className="text-center text-gray-600 mb-6">Start exchanging skills and earning time credits</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Quick Demo Access */}
      <div className="mb-6 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-emerald-700 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" />
            Quick Demo Access
          </h3>
          <p className="text-sm text-emerald-600 mt-1">Try TimeBank instantly with demo accounts</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            className="p-4 bg-white border-2 border-red-300 rounded-xl hover:border-red-400 hover:bg-red-50 transition-all group disabled:opacity-50 hover:shadow-lg"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
                ) : (
                  <span className="text-red-600 font-bold text-lg">G</span>
                )}
              </div>
              <p className="font-semibold text-red-700 text-base">Google Account</p>
              <p className="text-sm text-red-600">demo.google@gmail.com</p>
            </div>
          </button>

          {/* Demo User */}
          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              try {
                await register('demo@timebank.com', 'demo123', 'demo_user');
              } catch (err: any) {
                setError(err.message);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="p-4 bg-white border-2 border-emerald-300 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-all group disabled:opacity-50 hover:shadow-lg"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                ) : (
                  <span className="text-emerald-600 font-bold text-lg">D</span>
                )}
              </div>
              <p className="font-semibold text-emerald-700 text-base">Demo Account</p>
              <p className="text-sm text-emerald-600">demo@timebank.com</p>
            </div>
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white text-gray-500">Or create your account</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            required
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-2.5 rounded-lg font-medium hover:from-emerald-600 hover:to-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <button
          onClick={onToggleMode}
          className="text-emerald-600 font-medium hover:text-emerald-700 transition"
        >
          Log in
        </button>
      </p>

      <div className="mt-4 p-3 bg-emerald-50 rounded-lg text-xs text-emerald-800">
        <p className="font-medium">Get 10 free time credits when you sign up!</p>
      </div>
    </div>
  );
};