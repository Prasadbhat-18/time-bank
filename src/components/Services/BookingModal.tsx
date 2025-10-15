import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { X, Calendar, Clock } from 'lucide-react';
import { Service } from '../../types';
import { dataService } from '../../services/dataService';

interface BookingModalProps {
  service: Service;
  onClose: () => void;
  onBooked: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ service, onClose, onBooked }) => {
  const { user } = useAuth();
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      const scheduledStart = new Date(`${date}T${startTime}`);
      const scheduledEnd = new Date(scheduledStart.getTime() + duration * 60 * 60 * 1000);

      await dataService.createBooking({
        service_id: service.id,
        provider_id: service.provider_id,
        requester_id: user.id,
        scheduled_start: scheduledStart.toISOString(),
        scheduled_end: scheduledEnd.toISOString(),
        duration_hours: duration,
        confirmation_status: 'pending'
      });

      onBooked();
    } catch (err: any) {
      setError(err.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalCredits = duration * service.credits_per_hour;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full">
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Book Service</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-1">{service.title}</h3>
            <p className="text-sm text-gray-600">{service.description}</p>
            {service.provider && (
              <p className="text-sm text-gray-500 mt-2">Provider: {service.provider.username}</p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
              <Clock className="w-4 h-4 inline mr-1" />
              Start Time
            </label>
            <input
              id="time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
              Duration (hours)
            </label>
            <input
              id="duration"
              type="number"
              min="1"
              max="8"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              required
            />
          </div>

          <div className="bg-emerald-50 rounded-lg p-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium text-gray-800">{duration} hour{duration !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Rate:</span>
              <span className="font-medium text-gray-800">{service.credits_per_hour} credit/hour</span>
            </div>
            <div className="border-t border-emerald-200 mt-2 pt-2 flex items-center justify-between">
              <span className="font-semibold text-gray-800">Credits to Hold:</span>
              <span className="text-xl font-bold text-emerald-700">{totalCredits} credits</span>
            </div>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-medium">💡 Note:</span> Credits will be held (reserved) until the service provider confirms your booking. 
                If declined, credits will be returned to your balance.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending Request...' : 'Request Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};