import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Booking } from '../../types';
import { dataService } from '../../services/dataService';
import { ReviewModal } from './ReviewModal';

export const BookingList: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user]);

  const loadBookings = async () => {
    if (user) {
      const data = await dataService.getBookings(user.id);
      setBookings(data);
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, status: 'confirmed' | 'completed' | 'cancelled') => {
    await dataService.updateBooking(bookingId, { status });
    await loadBookings();
  };

  const handleLeaveReview = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowReviewModal(true);
  };

  const filteredBookings = bookings.filter((b) => filter === 'all' || b.status === filter);

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-700',
      confirmed: 'bg-blue-100 text-blue-700',
      completed: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">My Bookings</h1>
        <p className="text-gray-600 mt-1">Manage your scheduled service exchanges</p>
      </div>

      <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-lg border border-gray-100">
        {['all', 'pending', 'confirmed', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as typeof filter)}
            className={`flex-1 px-4 py-2 rounded-lg transition font-medium capitalize ${
              filter === f
                ? 'bg-emerald-500 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg border border-gray-100">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500">No bookings found</p>
          </div>
        ) : (
          filteredBookings.map((booking) => {
            const isProvider = booking.provider_id === user?.id;
            const otherUser = isProvider ? booking.requester : booking.provider;

            return (
              <div key={booking.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusBadge(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          {booking.status}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {isProvider ? 'Providing Service' : 'Receiving Service'}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {booking.service?.title || 'Service'}
                      </h3>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        {new Date(booking.scheduled_start).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">
                        {new Date(booking.scheduled_start).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {' - '}
                        {new Date(booking.scheduled_end).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {otherUser && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {otherUser.avatar_url ? (
                          <img src={otherUser.avatar_url} alt={otherUser.username} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{otherUser.username}</p>
                        <p className="text-xs text-gray-500">
                          {isProvider ? 'Service Requester' : 'Service Provider'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-sm">
                      <span className="text-gray-600">Duration: </span>
                      <span className="font-semibold text-gray-800">{booking.duration_hours}h</span>
                      <span className="text-gray-600 ml-3">Credits: </span>
                      <span className="font-semibold text-emerald-600">{booking.duration_hours}</span>
                    </div>

                    <div className="flex gap-2">
                      {booking.status === 'pending' && isProvider && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg transition"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition"
                          >
                            Decline
                          </button>
                        </>
                      )}

                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateStatus(booking.id, 'completed')}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg transition"
                        >
                          Mark Complete
                        </button>
                      )}

                      {booking.status === 'completed' && (
                        <button
                          onClick={() => handleLeaveReview(booking)}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition"
                        >
                          Leave Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showReviewModal && selectedBooking && (
        <ReviewModal
          booking={selectedBooking}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedBooking(null);
          }}
          onReviewed={() => {
            setShowReviewModal(false);
            setSelectedBooking(null);
            loadBookings();
          }}
        />
      )}
    </div>
  );
};