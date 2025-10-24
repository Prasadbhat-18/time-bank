import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { Booking } from '../../types';
import { dataService } from '../../services/dataService';
import { ReviewModal } from './ReviewModal';
import { bookingNotificationService } from '../../services/bookingNotificationService';
import ServiceCompletionCelebration from '../Services/ServiceCompletionCelebration';
import { getLevelUpBonusCredits } from '../../services/levelService';
import { XPGainToast } from '../Level/XPGainToast';

export const BookingList: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [confirmingBooking, setConfirmingBooking] = useState<string | null>(null);
  const [decliningBooking, setDecliningBooking] = useState<string | null>(null);
  const [providerNotes, setProviderNotes] = useState('');
  const [newBookingBanner, setNewBookingBanner] = useState<string | null>(null);
  const [updatingBookings, setUpdatingBookings] = useState<Set<string>>(new Set());
  const [bookingReviews, setBookingReviews] = useState<Record<string, boolean>>({});
  const [showTestPopup, setShowTestPopup] = useState(false);
  
  // Celebration modal state
  const [showCelebration, setShowCelebration] = useState(false);
  const [completionData, setCompletionData] = useState({
    xpEarned: 0,
    creditsEarned: 0,
    newLevel: 0,
    previousLevel: 0,
    totalServicesCompleted: 0,
    rating: 5,
    bonusInfo: { highRatingBonus: 0, consecutiveBonus: 0, perfectWeekBonus: 0 }
  });
  
  // XP Gain Toast state
  const [showXPToast, setShowXPToast] = useState(false);
  const [xpToastData, setXpToastData] = useState<{ xpGained: number; newLevel?: number }>({ xpGained: 0 });

  useEffect(() => {
    if (user) {
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          console.log('🔔 Notification permission:', permission);
        });
      }
      
      // Add a small delay to ensure authentication is fully established
      const timer = setTimeout(() => {
        console.log('🔄 Loading bookings for user:', user.id);
        loadBookings();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Debug: Log updatingBookings state changes
  useEffect(() => {
    console.log('Updating bookings state changed:', Array.from(updatingBookings));
  }, [updatingBookings]);

  // Live notification for providers when a new booking is created
  useEffect(() => {
    if (!user) return;
    const unsub = bookingNotificationService.subscribeToProviderBookings(user.id, (booking: any) => {
      console.log('🔔 New booking notification received:', booking);
      const requester = booking?.requester?.username || booking?.requester_name || booking?.requester_id || 'A user';
      const service = booking?.service?.title || booking?.service_title || 'your service';
      
      // Set notification banner with enhanced message
      setNewBookingBanner(`🎉 New Booking! ${requester} booked "${service}"`);
      
      // Play notification sound (optional)
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzuT2fPJdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzuT2fPJdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzuT2fPJdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzuT2fPJdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzuT2fPJdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzuT2fPJdSYE');
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignore errors if audio fails
      } catch (e) {
        // Ignore audio errors
      }
      
      // Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New TimeBank Booking!', {
          body: `${requester} booked "${service}"`,
          icon: '/favicon.ico',
          tag: 'booking-notification'
        });
      }
      
      loadBookings();
      // auto-hide after 8s (longer for better visibility)
      setTimeout(() => setNewBookingBanner(null), 8000);
    });
    return () => { try { unsub(); } catch {} };
  }, [user?.id]);

  const loadBookings = async () => {
    if (user) {
      const data = await dataService.getBookings(user.id);
      console.log('Loaded bookings:', data.map(b => ({ id: b.id, status: b.status, confirmation_status: b.confirmation_status })));
      setBookings(data);
      
      // Load reviews to check which bookings already have reviews from this user
      const reviews = await dataService.getReviewsByUser(user.id);
      const reviewMap: Record<string, boolean> = {};
      reviews.forEach(review => {
        reviewMap[review.booking_id] = true;
      });
      setBookingReviews(reviewMap);
      
      setLoading(false);
    }
  };


  const handleMarkAsCompleted = async (booking: Booking) => {
    console.log('🎯 handleMarkAsCompleted called:', {
      bookingId: booking.id,
      bookingStatus: booking.status,
      userId: user?.id,
      providerId: booking.provider_id,
      isUpdating: updatingBookings.has(booking.id)
    });
    
    if (!user || updatingBookings.has(booking.id)) {
      console.log('❌ Early return:', { hasUser: !!user, isUpdating: updatingBookings.has(booking.id) });
      return;
    }
    
    setUpdatingBookings(prev => new Set(prev).add(booking.id));
    console.log('✅ Started updating booking:', booking.id);
    
    // Store the current state BEFORE update to calculate differences
    const previousLevel = user.level || 1;
    const previousXP = user.experience_points || 0;
    const previousServices = user.services_completed || 0;
    
    try {
      // Update booking status to completed (this also updates user XP/level in dataService)
      console.log('📝 Updating booking status to completed...');
      await dataService.updateBooking(booking.id, { status: 'completed' });
      console.log('✅ Booking updated successfully');
      
      // CRITICAL: Re-fetch the updated user data from dataService
      // This ensures we get the latest XP/level after updateBooking modified it
      if (updateUser) {
        try {
          console.log('🔄 Re-fetching updated user data for current user...');
          const updatedCurrentUser = await dataService.getUserById(user.id);
          
          if (updatedCurrentUser) {
            console.log('📊 Fetched updated user:', {
              level: updatedCurrentUser.level,
              xp: updatedCurrentUser.experience_points,
              services: updatedCurrentUser.services_completed,
              customCreditsEnabled: updatedCurrentUser.custom_credits_enabled
            });
            
            // Calculate ACTUAL XP gained from the difference
            const actualXPGained = (updatedCurrentUser.experience_points || 0) - previousXP;
            const actualLevelGained = (updatedCurrentUser.level || 1) > previousLevel;
            
            console.log('📈 Actual gains:', {
              xpGained: actualXPGained,
              leveledUp: actualLevelGained,
              newLevel: updatedCurrentUser.level,
              previousLevel: previousLevel
            });
            
            // Calculate credits for celebration modal
            const baseCredits = booking.service?.credits_per_hour
              ? (booking.duration_hours || 1) * (booking.service.credits_per_hour || 1)
              : (booking.duration_hours || 1);
            const levelUpBonus = actualLevelGained ? getLevelUpBonusCredits(updatedCurrentUser.level || previousLevel) : 0;
            
            // Show celebration modal with ACTUAL earned rewards
            setCompletionData({
              xpEarned: actualXPGained,
              creditsEarned: baseCredits + levelUpBonus,
              newLevel: updatedCurrentUser.level || previousLevel,
              previousLevel,
              totalServicesCompleted: updatedCurrentUser.services_completed || previousServices,
              rating: 5,
              bonusInfo: { highRatingBonus: actualXPGained > 50 ? 20 : 0, consecutiveBonus: 0, perfectWeekBonus: 0 },
            });
            setShowCelebration(true);
            
            // Update AuthContext with the fresh data - ALWAYS update for current user
            console.log('🔄 Updating AuthContext with fresh user data...');
            await updateUser({
              level: updatedCurrentUser.level,
              experience_points: updatedCurrentUser.experience_points,
              services_completed: updatedCurrentUser.services_completed,
              custom_credits_enabled: updatedCurrentUser.custom_credits_enabled,
            });
            
            console.log('✅ AuthContext updated with fresh user data');
            
            // Give the state updates a moment to propagate
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Show XP gain toast notification with ACTUAL values
            setXpToastData({
              xpGained: actualXPGained,
              newLevel: actualLevelGained ? updatedCurrentUser.level : undefined
            });
            setShowXPToast(true);
            
            // Now trigger UI refresh for ALL components
            console.log('📡 Dispatching refresh event for UI components');
            window.dispatchEvent(new CustomEvent('timebank:refreshProfileAndDashboard', {
              detail: { 
                user: updatedCurrentUser,
                timestamp: Date.now()
              }
            }));
            
            // Also dispatch level up event if level changed
            if (actualLevelGained) {
              console.log('🎉 Dispatching level up event');
              window.dispatchEvent(new CustomEvent('timebank:levelUp', {
                detail: {
                  userId: user.id,
                  newLevel: updatedCurrentUser.level,
                  previousLevel,
                  xpGained: actualXPGained
                }
              }));
            }
          } else {
            console.warn('⚠️ getUserById returned null');
          }
        } catch (updateErr) {
          console.error('❌ Failed to update user context:', updateErr);
        }
      }
      
      // Reload bookings to show updated status
      await loadBookings();
      
    } catch (error) {
      console.error('Failed to mark service as completed:', error);
      alert(`Failed to complete service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUpdatingBookings(prev => {
        const newSet = new Set(prev);
        newSet.delete(booking.id);
        return newSet;
      });
    }
  };

  const handleLeaveReview = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowReviewModal(true);
  };

  const handleConfirmBooking = async (bookingId: string) => {
    if (!user) return;
    try {
      await dataService.confirmBooking(bookingId, user.id, providerNotes);
      setConfirmingBooking(null);
      setProviderNotes('');
      await loadBookings();
    } catch (error) {
      console.error('Failed to confirm booking:', error);
    }
  };

  const handleDeclineBooking = async (bookingId: string) => {
    if (!user) return;
    try {
      await dataService.declineBooking(bookingId, user.id, providerNotes);
      setDecliningBooking(null);
      setProviderNotes('');
      await loadBookings();
    } catch (error) {
      console.error('Failed to decline booking:', error);
    }
  };

  const filteredBookings = bookings.filter((b) => filter === 'all' || b.status === filter);
  const sortedBookings = [...filteredBookings].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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

    {/* New booking popup banner */}
    {newBookingBanner && (
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-2xl border-2 border-emerald-400 animate-bounce">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <span className="text-2xl">🔔</span>
          {newBookingBanner}
        </div>
      </div>
    )}

      <div className="space-y-4">
        {sortedBookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg border border-gray-100">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500">No bookings found</p>
          </div>
        ) : (
          sortedBookings.map((booking) => {
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
                        {booking.confirmation_status === 'awaiting_provider' && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                            <MessageSquare className="w-3 h-3 inline mr-1" />
                            Awaiting Provider
                          </span>
                        )}
                        {booking.confirmation_status === 'declined' && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            Declined
                          </span>
                        )}
                        {booking.credits_held && !booking.credits_transferred && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {booking.credits_held} credits held
                          </span>
                        )}
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {isProvider ? 'Providing Service' : 'Receiving Service'}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {booking.service?.title || 'Service'}
                      </h3>
                      {otherUser && (
                        <p className="text-sm font-medium text-blue-600 mt-1">
                          {isProvider ? `Requested by: ${otherUser.username}` : `Provided by: ${otherUser.username}`}
                        </p>
                      )}
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
                      {booking.confirmation_status === 'awaiting_provider' && isProvider && (
                        <>
                          <button
                            onClick={() => setConfirmingBooking(booking.id)}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg transition flex items-center gap-1"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            Confirm
                          </button>
                          <button
                            onClick={() => setDecliningBooking(booking.id)}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition flex items-center gap-1"
                          >
                            <ThumbsDown className="w-4 h-4" />
                            Decline
                          </button>
                        </>
                      )}

                      {booking.status === 'confirmed' && (
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <select
                              onChange={(e) => {
                                if (e.target.value === 'complete') {
                                  handleMarkAsCompleted(booking);
                                  e.target.value = ''; // Reset the select
                                }
                              }}
                              disabled={updatingBookings.has(booking.id)}
                              className={`px-4 py-2 text-white font-semibold rounded-lg transition-colors cursor-pointer ${
                                updatingBookings.has(booking.id) 
                                  ? 'bg-gray-400 cursor-not-allowed' 
                                  : 'bg-emerald-500 hover:bg-emerald-600'
                              }`}
                              defaultValue=""
                              aria-label="Complete Service"
                            >
                              <option value="" disabled>
                                {updatingBookings.has(booking.id) ? 'Processing...' : 'Complete Service'}
                              </option>
                              <option value="complete" className="text-black">
                                ✓ Mark as Completed
                              </option>
                            </select>
                          </div>
                          <label className={`flex items-center gap-2 text-sm ${updatingBookings.has(booking.id) ? 'opacity-60' : ''}`}>
                            <input
                              type="checkbox"
                              disabled={updatingBookings.has(booking.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleMarkAsCompleted(booking);
                                }
                              }}
                              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                              aria-label="Mark booking as completed"
                            />
                            Completed
                          </label>
                        </div>
                      )}

                      {booking.status === 'completed' && (
                        bookingReviews[booking.id] ? (
                          <div className="px-4 py-2 bg-green-100 text-green-800 text-sm rounded-lg">
                            ✓ Review Submitted
                          </div>
                        ) : (
                          <button
                            onClick={() => handleLeaveReview(booking)}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition"
                          >
                            Leave Review
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmingBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <ThumbsUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Confirm Service Booking</h3>
                <p className="text-sm text-gray-600">Confirm this booking to receive payment</p>
              </div>
            </div>

            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-800">
                <span className="font-medium">💰 Credits Transfer:</span> The held credits will be transferred to your account upon confirmation.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={providerNotes}
                onChange={(e) => setProviderNotes(e.target.value)}
                placeholder="Add any notes for the requester..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConfirmingBooking(null);
                  setProviderNotes('');
                }}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmingBooking && handleConfirmBooking(confirmingBooking)}
                className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition font-medium"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {decliningBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <ThumbsDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Decline Service Booking</h3>
                <p className="text-sm text-gray-600">Decline this booking and return credits</p>
              </div>
            </div>

            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <span className="font-medium">💳 Credits Return:</span> The held credits will be returned to the requester's account.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for declining (optional)
              </label>
              <textarea
                value={providerNotes}
                onChange={(e) => setProviderNotes(e.target.value)}
                placeholder="Let them know why you can't provide this service..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDecliningBooking(null);
                  setProviderNotes('');
                }}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => decliningBooking && handleDeclineBooking(decliningBooking)}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-medium"
              >
                Decline Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && selectedBooking && (
        <ReviewModal
          booking={selectedBooking}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedBooking(null);
          }}
          onReviewed={async () => {
            setShowReviewModal(false);
            setSelectedBooking(null);
            await loadBookings(); // This will reload both bookings and reviews
          }}
        />
      )}

      {/* Test Popup */}
      {showTestPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Service Completed!</h2>
            <p className="text-gray-600 mb-4">+50 XP • +10 Credits</p>
            <button 
              onClick={() => setShowTestPopup(false)}
              className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}

      {/* Service Completion Celebration Modal */}
      <ServiceCompletionCelebration
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        xpEarned={completionData.xpEarned}
        creditsEarned={completionData.creditsEarned}
        newLevel={completionData.newLevel}
        previousLevel={completionData.previousLevel}
        totalServicesCompleted={completionData.totalServicesCompleted}
        rating={completionData.rating}
        bonusInfo={completionData.bonusInfo}
      />
      
      {/* XP Gain Toast Notification */}
      {showXPToast && (
        <XPGainToast
          xpGained={xpToastData.xpGained}
          newLevel={xpToastData.newLevel}
          onClose={() => setShowXPToast(false)}
        />
      )}
    </div>
  );
};