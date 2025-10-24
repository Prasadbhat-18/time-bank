import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { X, Calendar, Clock } from 'lucide-react';
import { Service } from '../../types';
import { dataService } from '../../services/dataService';
import { groqChatService } from '../../services/groqChatService';
import { MessageCircle, Send } from 'lucide-react';
import ServiceBalanceModal from './ServiceBalanceModal';
import { canRequestService } from '../../services/levelService';

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
  const [showChat, setShowChat] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [showMessageSentPopup, setShowMessageSentPopup] = useState(false);

  // Check service balance
  const servicesCompleted = user?.services_completed || 0;
  const servicesRequested = user?.services_requested || 0;
  const canRequest = canRequestService(servicesCompleted, servicesRequested);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔄 Booking form submitted');
    
    if (!user) {
      console.error('❌ No user found');
      setError('Please log in to book a service');
      return;
    }

    if (!date || !startTime) {
      setError('Please select both date and time');
      return;
    }

    if (duration < 0.5) {
      setError('Duration must be at least 30 minutes');
      return;
    }

    setError('');
    setLoading(true);
    console.log('📋 Booking details:', { date, startTime, duration, serviceId: service.id });

    try {
      const scheduledStart = new Date(`${date}T${startTime}`);
      const scheduledEnd = new Date(scheduledStart.getTime() + duration * 60 * 60 * 1000);

      console.log('📅 Scheduled times:', {
        start: scheduledStart.toISOString(),
        end: scheduledEnd.toISOString()
      });

      const bookingData = {
        service_id: service.id,
        provider_id: service.provider_id,
        requester_id: user.id,
        scheduled_start: scheduledStart.toISOString(),
        scheduled_end: scheduledEnd.toISOString(),
        duration_hours: duration,
        confirmation_status: 'pending' as const
      };

      console.log('💾 Creating booking with data:', bookingData);
      const newBooking = await dataService.createBooking(bookingData);
      console.log('✅ Booking created successfully:', newBooking);

      // Only show the limit warning if this booking puts the user over the limit
      const newServicesRequested = servicesRequested + 1;
      const isBarred = !canRequestService(servicesCompleted, newServicesRequested);
      
      if (isBarred) {
        console.log('⚠️ User reached service limit, showing warning');
        setShowLimitWarning(true);
      } else {
        console.log('🎉 Booking completed successfully');
        onBooked();
      }
    } catch (err: any) {
      console.error('❌ Booking failed:', err);
      setError(err.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalCredits = duration * service.credits_per_hour;

  // Handle closing the limit warning
  const handleCloseLimitWarning = () => {
    setShowLimitWarning(false);
    onClose();
  };

  // Handle sending chat messages
  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !user || !service.provider) return;

    try {
      const message = await groqChatService.sendMessage(
        user.id,
        service.provider_id,
        chatMessage,
        user.username || user.email,
        service.provider.username || service.provider.email
      );

      // Add message to local state
      setChatMessages(prev => [...prev, message]);
      setChatMessage('');
      
      // Show success popup
      setShowMessageSentPopup(true);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  return (
    <>
      {/* Limit Reached Warning Modal */}
      {showLimitWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Service Request Limit Reached</h2>
              <p className="text-gray-600 mb-4">
                You've successfully booked this service! However, you've reached your service request quota.
              </p>
              <p className="text-gray-600 mb-4">
                You've successfully booked this service! However, you've reached your service request quota.
              </p>
              <div className="bg-amber-50 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold">Current Status:</span> {servicesRequested} requested, {servicesCompleted} completed
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">To request more services:</span> You can request up to {servicesCompleted === 0 ? '3 services before providing your first' : `${servicesCompleted + 3} total services (${servicesCompleted} completed + 3 more)`}
                </p>
              </div>
              <button
                onClick={handleCloseLimitWarning}
                className="w-full px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition"
              >
                Got it!
              </button>
              <button
                onClick={() => {
                  setShowLimitWarning(false);
                  setShowBalanceModal(true);
                }}
                className="w-full mt-2 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
            <h2 className="text-2xl font-bold text-gray-800">Book Service</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Main Content: Split into form and chat */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Left Column: Booking Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
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
              className="flex-1 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setShowChat(!showChat)}
              className="flex-1 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition font-medium"
            >
              {showChat ? 'Hide Chat' : 'Chat Now'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Booking...' : 'Book Now'}
            </button>
          </div>
            </form>

            {/* Right Column: Chat Panel */}
            {showChat && (
              <div className="hidden lg:flex flex-col border border-gray-200 rounded-lg overflow-hidden h-[600px]">
                <div className="bg-emerald-50 p-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-semibold text-gray-800">Chat with Provider</h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Discuss service details before booking
                  </p>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Start a conversation with the provider</p>
                      <p className="text-sm">Ask about availability, requirements, or any questions</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {chatMessages.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs px-3 py-2 rounded-lg ${
                              msg.senderId === user?.id
                                ? 'bg-emerald-500 text-white'
                                : 'bg-white text-gray-800 border border-gray-200'
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className={`text-xs mt-1 ${
                              msg.senderId === user?.id ? 'text-emerald-100' : 'text-gray-500'
                            }`}>
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!chatMessage.trim()}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white rounded-lg transition flex items-center gap-1"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Chat: Full width below form */}
            {showChat && (
              <div className="lg:hidden col-span-1 border border-gray-200 rounded-lg overflow-hidden h-[400px]">
                <div className="bg-emerald-50 p-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-medium text-gray-800">Chat with Provider</h3>
                  </div>
                </div>
                
                <div className="flex-1 p-3 overflow-y-auto bg-gray-50" style={{height: 'calc(100% - 120px)'}}>
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-4">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Start a conversation</p>
                      <p className="text-sm">Ask about availability, requirements, or any questions</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {chatMessages.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs px-2 py-1 rounded text-sm ${
                              msg.senderId === user?.id
                                ? 'bg-emerald-500 text-white'
                                : 'bg-white text-gray-800 border border-gray-200'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="p-3 border-t border-gray-200 bg-white">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type message..."
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!chatMessage.trim()}
                      className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white rounded text-sm"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service Balance Modal */}
      <ServiceBalanceModal
        isOpen={showBalanceModal}
        onClose={() => setShowBalanceModal(false)}
        servicesCompleted={servicesCompleted}
        servicesRequested={servicesRequested}
        canRequest={canRequest}
      />

      {/* Message Sent Popup */}
      {showMessageSentPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Message Sent!</h3>
              <p className="text-gray-600 mb-6">
                Your message has been delivered to <strong>{service.provider?.username || 'the provider'}</strong>
              </p>
              <button
                onClick={() => setShowMessageSentPopup(false)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};