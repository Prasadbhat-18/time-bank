import React from 'react';
import { X, Lock, LogIn } from 'lucide-react';

interface LoginPromptModalProps {
  onClose: () => void;
  onLoginRedirect: () => void;
}

export const LoginPromptModal: React.FC<LoginPromptModalProps> = ({ 
  onClose, 
  onLoginRedirect 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Lock className="w-5 h-5 text-cyan-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Login Required</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Ready to Explore All Features?
          </h3>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            You're currently in <span className="font-semibold text-cyan-600">demo mode</span>. 
            To book services, offer your skills, and access all features, please create an account or login.
          </p>

          <div className="space-y-3">
            <button
              onClick={onLoginRedirect}
              className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Create Account / Login
            </button>
            
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Continue Browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};