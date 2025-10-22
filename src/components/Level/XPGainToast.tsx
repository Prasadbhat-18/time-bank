import React, { useEffect, useState } from 'react';
import { TrendingUp, Star, Zap } from 'lucide-react';

interface XPGainToastProps {
  xpGained: number;
  newLevel?: number;
  onClose: () => void;
}

export const XPGainToast: React.FC<XPGainToastProps> = ({ xpGained, newLevel, onClose }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-24 right-4 z-50 transition-all duration-300 ${
        show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-lg shadow-2xl border-2 border-indigo-400 min-w-[300px]">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
              <span className="font-bold text-lg">+{xpGained} XP</span>
            </div>
            {newLevel ? (
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                <span className="font-semibold">Level Up! Now Level {newLevel}</span>
              </div>
            ) : (
              <span className="text-sm opacity-90">Experience Earned!</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
