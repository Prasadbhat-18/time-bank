import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, Eye, EyeOff, Sparkles, Lock, Mail } from 'lucide-react';

interface LoginFormProps {
  onToggleMode: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMousePosition({ x, y });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto perspective-1000">
      <div
        ref={cardRef}
        className="relative p-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:shadow-emerald-500/20 hover:shadow-3xl"
        style={{
          transform: cardRef.current
            ? `rotateX(${(mousePosition.y - cardRef.current.clientHeight / 2) / 50}deg) rotateY(${(mousePosition.x - cardRef.current.clientWidth / 2) / 50}deg)`
            : 'none',
        }}
      >
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(16, 185, 129, 0.3), transparent 50%)`,
          }}
        />

        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 animate-pulse" />

        <div className="relative z-10">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl blur-xl opacity-50 animate-pulse" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 hover:rotate-12">
                <LogIn className="w-8 h-8 text-white animate-pulse" />
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-2 animate-gradient">
              Welcome Back
            </h2>
            <p className="text-gray-600 flex items-center justify-center gap-1">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Log in to continue your journey
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border-2 border-red-200 rounded-xl text-red-700 text-sm animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <label
                htmlFor="email"
                className={`block text-sm font-medium mb-2 transition-colors ${
                  focusedField === 'email' ? 'text-emerald-600' : 'text-gray-700'
                }`}
              >
                Email Address
              </label>
              <div className="relative group">
                <Mail
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                    focusedField === 'email' ? 'text-emerald-500' : 'text-gray-400'
                  }`}
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-300 hover:border-emerald-300"
                  required
                />
                <div
                  className={`absolute inset-0 rounded-xl pointer-events-none transition-opacity ${
                    focusedField === 'email' ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
                  }}
                />
              </div>
            </div>

            <div className="relative">
              <label
                htmlFor="password"
                className={`block text-sm font-medium mb-2 transition-colors ${
                  focusedField === 'password' ? 'text-emerald-600' : 'text-gray-700'
                }`}
              >
                Password
              </label>
              <div className="relative group">
                <Lock
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                    focusedField === 'password' ? 'text-emerald-500' : 'text-gray-400'
                  }`}
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-12 pr-12 py-3.5 bg-white/50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-300 hover:border-emerald-300"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <div
                  className={`absolute inset-0 rounded-xl pointer-events-none transition-opacity ${
                    focusedField === 'password' ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white py-4 rounded-xl font-semibold overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Log In
                  </>
                )}
              </span>
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={onToggleMode}
              className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors relative group"
            >
              <span className="relative z-10">Sign up</span>
              <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
            </button>
          </p>

          <div className="mt-6 p-4 bg-gradient-to-br from-gray-50 to-emerald-50/30 border border-emerald-100 rounded-xl text-xs text-gray-600">
            <p className="font-semibold text-emerald-700 mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Demo Account:
            </p>
            <p className="font-mono">Email: demo@example.com</p>
            <p className="font-mono">Password: password</p>
          </div>
        </div>

        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
    </div>
  );
};