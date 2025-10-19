import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Wallet,
  Calendar,
  TrendingUp,
  Star,
  Clock,
  Users,
  ArrowRight,
  MessageCircle,
  Bot,
} from 'lucide-react';
import { TimeCredit, Booking, Service, Review } from '../../types';
import { dataService } from '../../services/dataService';
import { ServiceMonitor } from '../Services/ServiceMonitor';

export const DashboardView: React.FC = () => {
  const { user } = useAuth();
  const [timeCredit, setTimeCredit] = useState<TimeCredit | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [recentServices, setRecentServices] = useState<Service[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChatbot, setShowChatbot] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    const [credit, bookings, services, reviews] = await Promise.all([
      dataService.getTimeCredits(user.id),
      dataService.getBookings(user.id),
      dataService.getUserServices(user.id),
      dataService.getReviews(user.id),
    ]);

    setTimeCredit(credit);
    setUpcomingBookings(
      bookings
        .filter((b) => b.status !== 'completed' && b.status !== 'cancelled')
        .slice(0, 3)
    );
    setRecentServices(services.slice(0, 3));
    setRecentReviews(reviews.slice(0, 3));
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      {/* AI Chatbot Button */}
      <button
        className="fixed bottom-20 md:bottom-8 left-4 md:left-8 z-50 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-full shadow-lg flex items-center gap-2 hover:scale-105 hover:shadow-blue-500/40 transition-all text-sm md:text-lg font-semibold"
        onClick={() => setShowChatbot(true)}
      >
        <Bot className="w-5 h-5 md:w-6 md:h-6" />
        AI Assistant
      </button>

      {/* AI Chatbot Modal */}
      {showChatbot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 h-[600px] flex flex-col relative animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-800">TimeBank AI Assistant</h2>
              </div>
              <button
                className="text-gray-400 hover:text-blue-600 text-2xl"
                onClick={() => setShowChatbot(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <Bot className="w-8 h-8 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="bg-white p-3 rounded-lg shadow-sm max-w-xs">
                    <p className="text-gray-800">
                      Hello! I'm your TimeBank AI assistant. I can help you with:
                    </p>
                    <ul className="mt-2 text-sm text-gray-600 space-y-1">
                      <li>• Understanding how TimeBank works</li>
                      <li>• Finding the right services</li>
                      <li>• Managing your credits</li>
                      <li>• Booking assistance</li>
                      <li>• General questions</li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    Ask me anything about TimeBank!
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your question here..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      // Handle sending message - this would integrate with the Noupe chatbot
                      window.postMessage({ type: 'noupe:open' }, '*');
                    }
                  }}
                />
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => {
                    // Trigger the external Noupe chatbot
                    window.postMessage({ type: 'noupe:open' }, '*');
                  }}
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Powered by AI • Connected to Noupe Assistant
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-gray-800">Welcome back, {user?.username}!</h1>
        <p className="text-gray-600 mt-1">Here's what's happening with your TimeBank account</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Wallet className="w-8 h-8 opacity-90" />
            <Clock className="w-12 h-12 opacity-20" />
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Time Credits</h3>
          <p className="text-4xl font-bold">{timeCredit?.balance.toFixed(1) || '0.0'}</p>
          <p className="text-sm opacity-75 mt-2">Available to spend</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Active Bookings</h3>
          <p className="text-4xl font-bold text-gray-800">{upcomingBookings.length}</p>
          <p className="text-sm text-gray-500 mt-2">Upcoming exchanges</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Reputation</h3>
          <p className="text-4xl font-bold text-gray-800">{user?.reputation_score.toFixed(1)}</p>
          <p className="text-sm text-gray-500 mt-2">{user?.total_reviews} reviews</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Upcoming Bookings</h2>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>

          <div className="divide-y divide-gray-100">
            {upcomingBookings.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No upcoming bookings</p>
              </div>
            ) : (
              upcomingBookings.map((booking) => (
                <div key={booking.id} className="px-6 py-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{booking.service?.title}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(booking.scheduled_start).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                        {' at '}
                        {new Date(booking.scheduled_start).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        booking.status === 'confirmed'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Recent Reviews</h2>
            <Star className="w-5 h-5 text-gray-400" />
          </div>

          <div className="divide-y divide-gray-100">
            {recentReviews.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                <Star className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No reviews yet</p>
              </div>
            ) : (
              recentReviews.map((review) => (
                <div key={review.id} className="px-6 py-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {review.reviewer?.avatar_url ? (
                          <img
                            src={review.reviewer.avatar_url}
                            alt={review.reviewer.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-800">
                        {review.reviewer?.username}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{review.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Your Services</h2>
          <TrendingUp className="w-5 h-5 text-gray-400" />
        </div>

        <div className="divide-y divide-gray-100">
          {recentServices.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No services posted yet</p>
            </div>
          ) : (
            recentServices.map((service) => (
              <div key={service.id} className="px-6 py-4 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{service.title}</p>
                    <p className="text-sm text-gray-600 line-clamp-1 mt-1">{service.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        service.type === 'offer'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {service.type}
                    </span>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Quick Stats
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Earned:</span>
              <span className="font-semibold text-gray-800">
                {timeCredit?.total_earned.toFixed(1)} credits
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Spent:</span>
              <span className="font-semibold text-gray-800">
                {timeCredit?.total_spent.toFixed(1)} credits
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Member Since:</span>
              <span className="font-semibold text-gray-800">
                {user?.created_at &&
                  new Date(user.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Community Impact
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>You're making a difference in the TimeBank community!</p>
            <p className="text-xs">
              Every service exchange strengthens our skill-sharing network and helps build a more
              collaborative society.
            </p>
          </div>
        </div>
      </div>

      {/* Firebase Service Monitor */}
      <ServiceMonitor />
    </div>
  );
};