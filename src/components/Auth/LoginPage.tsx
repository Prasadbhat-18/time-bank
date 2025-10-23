import React, { useState } from 'react';
import './login.css';
import CountrySelect from './CountrySelect';
import { LoginForm } from './LoginForm';

const slides = [
  {
    title: 'Local Help, Global Heart',
    text: 'Exchange time and skills with neighbors and grow your network.',
  },
  {
    title: 'Earn Reputation',
    text: 'Offer services, get reviews, and be rewarded with trust and credits.',
  },
  {
    title: 'Secure & Private',
    text: 'We value your privacy — phone and email authentication with secure OTP.',
  },
  {
    title: 'Support When You Need',
    text: 'Emergency SOS and trusted contacts make the platform safer for everyone.',
  },
];

const LoginPage: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [showPhone, setShowPhone] = useState(true);
  const [showEmail, setShowEmail] = useState(false);

  // infinite carousel
  React.useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="login-page">
      <div className="carousel">
        {slides.map((s, i) => (
          <div
            key={i}
            className={`slide ${i === index ? 'active' : ''}`}
            aria-hidden={i !== index}
          >
            <h2>{s.title}</h2>
            <p>{s.text}</p>
          </div>
        ))}
        <div className="indicators">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`dot ${i === index ? 'dot-active' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="auth-pane">
        <div className="auth-header">
          <h1>Welcome to TimeBank</h1>
          <p className="subtitle">Share skills. Earn trust. Build community.</p>
        </div>

        <div className="auth-toggle">
          <button
            className={`toggle-btn ${showPhone ? 'active' : ''}`}
            onClick={() => { setShowPhone(true); setShowEmail(false); }}
          >
            Phone
          </button>
          <button
            className={`toggle-btn ${showEmail ? 'active' : ''}`}
            onClick={() => { setShowEmail(true); setShowPhone(false); }}
          >
            Email
          </button>
        </div>

        <div className="auth-body">
          {showPhone && (
            <div className="phone-login">
              <div className="social-login">
                <button className="google-btn">Sign in with Google</button>
              </div>

              <div className="phone-form">
                <div className="phone-entry">
                  <CountrySelect />
                  <input className="phone-input" placeholder="Enter phone number" />
                </div>
                <button className="primary">Send OTP</button>
              </div>
            </div>
          )}

          {showEmail && (
            <div className="email-login">
              <LoginForm onToggleMode={() => { /* noop for page */ }} />
            </div>
          )}
        </div>

        <div className="register-cta">
          <p>New to TimeBank?</p>
          <a href="/register" className="register-link">Create an account</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
