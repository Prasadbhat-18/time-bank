import React, { useState } from "react";

// SVG icons
const LightningIcon = () => (
  <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
    <path d="M13 2L3 14h7v8l8-12h-7V2z" stroke="#FFD600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MailIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <rect width="20" height="14" x="2" y="5" rx="2" stroke="#00E1FF" strokeWidth="2"/>
    <path d="M2 5l10 7 10-7" stroke="#00E1FF" strokeWidth="2"/>
  </svg>
);

const LockIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <rect width="16" height="10" x="4" y="11" rx="2" stroke="#00E1FF" strokeWidth="2"/>
    <path d="M8 11V7a4 4 0 118 0v4" stroke="#00E1FF" strokeWidth="2"/>
  </svg>
);

const GoogleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 48 48">
    <g>
      <path fill="#4285F4" d="M24 9.5c3.54 0 6.73 1.22 9.24 3.23l6.93-6.93C36.1 2.34 30.47 0 24 0 14.64 0 6.27 5.82 2.24 14.19l8.06 6.27C12.41 13.09 17.73 9.5 24 9.5z"/>
      <path fill="#34A853" d="M46.1 24.5c0-1.54-.14-3.03-.4-4.47H24v8.47h12.44c-.54 2.9-2.18 5.36-4.65 7.01l7.23 5.62C43.73 37.09 46.1 31.32 46.1 24.5z"/>
      <path fill="#FBBC05" d="M10.3 28.66a14.5 14.5 0 010-9.32l-8.06-6.27A24 24 0 000 24c0 3.77.9 7.34 2.24 10.47l8.06-6.27z"/>
      <path fill="#EA4335" d="M24 46c6.47 0 11.91-2.14 15.87-5.84l-7.23-5.62c-2.01 1.36-4.57 2.17-8.64 2.17-6.27 0-11.59-3.59-14.7-8.8l-8.06 6.27C6.27 42.18 14.64 46 24 46z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </g>
  </svg>
);

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Replace with your actual auth logic
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to your authentication logic
    alert(`Login with ${email} / ${password}`);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#181A20] via-[#1C2230] to-[#1B0F1F] flex flex-col lg:flex-row items-center justify-center">
      {/* Left: Feature Card */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        <div className="mb-8 flex items-center">
          {/* Logo */}
          <div className="mr-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-cyan-400 flex items-center justify-center shadow-lg">
              <LightningIcon />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white tracking-wide">
              <span className="text-cyan-400">TIME</span>
              <span className="text-pink-400">△</span>
              <span className="text-yellow-400">BANK</span>
            </h1>
            <p className="text-cyan-300 text-sm mt-1">Where time is the true currency.</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-400/30 to-yellow-700/10 rounded-xl shadow-lg border-2 border-yellow-400 p-8 w-full max-w-md">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-lg bg-yellow-400/30 flex items-center justify-center">
              <LightningIcon />
            </div>
            <span className="ml-4 text-2xl font-bold text-yellow-100 drop-shadow">Instant Transactions</span>
          </div>
          <p className="text-yellow-100 text-lg mb-4">
            Lightning-fast exchanges in the TimeBank network. No delays, no intermediaries.
          </p>
          <div className="flex space-x-2 mt-4">
            <span className="w-8 h-2 rounded-full bg-yellow-400/70"></span>
            <span className="w-8 h-2 rounded-full bg-yellow-400/40"></span>
            <span className="w-8 h-2 rounded-full bg-yellow-400/20"></span>
          </div>
        </div>
        <div className="mt-8 text-xs text-gray-400 flex items-center">
          © 2025 TimeBank &nbsp; • &nbsp; All rights reserved.
        </div>
      </div>

      {/* Right: Login Card */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <form
          className="w-full max-w-md bg-gradient-to-br from-[#20253A] to-[#181A20] rounded-3xl shadow-2xl border border-cyan-400/40 p-10"
          onSubmit={handleLogin}
        >
          <h2 className="text-3xl font-bold text-white mb-2">Access Terminal</h2>
          <p className="text-cyan-300 mb-8">Enter credentials to continue</p>
          <label className="block text-sm font-medium text-white mb-2" htmlFor="email">
            EMAIL ADDRESS
          </label>
          <div className="flex items-center bg-[#181A20] rounded-xl border border-cyan-400/40 mb-4 px-4 py-2 focus-within:ring-2 focus-within:ring-cyan-400">
            <MailIcon />
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="ml-2 w-full bg-transparent text-white placeholder-cyan-300 outline-none"
              placeholder="user@timebank.net"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <label className="block text-sm font-medium text-white mb-2" htmlFor="password">
            PASSWORD <span className="float-right text-cyan-400 cursor-pointer">RECOVERY</span>
          </label>
          <div className="flex items-center bg-[#181A20] rounded-xl border border-cyan-400/40 mb-6 px-4 py-2 focus-within:ring-2 focus-within:ring-cyan-400">
            <LockIcon />
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="ml-2 w-full bg-transparent text-white placeholder-cyan-300 outline-none"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-pink-400 to-yellow-400 text-lg font-bold text-white shadow-lg hover:scale-105 transition-transform duration-300 mb-6 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            INITIALIZE SESSION &rarr;
          </button>
          <div className="flex items-center my-6">
            <hr className="flex-grow border-cyan-400/30" />
            <span className="mx-4 text-cyan-300">OR CONTINUE</span>
            <hr className="flex-grow border-cyan-400/30" />
          </div>
          <button
            type="button"
            className="w-full flex items-center justify-center py-3 rounded-xl border border-cyan-400/40 bg-[#181A20] text-white font-semibold shadow hover:bg-cyan-900 transition-colors duration-300 mb-4 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            onClick={() => alert("Google login")}
          >
            <GoogleIcon />
            <span className="ml-2">GOOGLE ACCESS</span>
          </button>
          <div className="text-center mt-4 text-cyan-300">
            New user? <span className="text-pink-400 font-bold cursor-pointer">REGISTER ACCOUNT</span>
          </div>
        </form>
      </div>
    </div>
  );
}