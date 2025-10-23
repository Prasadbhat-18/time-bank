import React from 'react';
import './login.css';
import { RegisterForm } from './RegisterForm';

const RegisterPage: React.FC = () => {
  return (
    <div className="login-page single">
      <div className="auth-pane single-pane">
        <div className="auth-header">
          <h1>Create your TimeBank account</h1>
          <p className="subtitle">Formal registration to join our community</p>
        </div>

        <div className="auth-body">
          <RegisterForm onToggleMode={() => { window.location.href = '/login'; }} />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
