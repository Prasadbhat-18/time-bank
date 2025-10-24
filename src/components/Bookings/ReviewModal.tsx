import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { X, Star } from 'lucide-react';
import { Booking } from '../../types';
import { dataService } from '../../services/dataService';

interface ReviewModalProps {
  booking: Booking;
  onClose: () => void;
  onReviewed: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ booking, onClose, onReviewed }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Only requesters can submit reviews (not providers)
  const isRequester = booking.requester_id === user?.id;
  const reviewee = booking.provider; // Always reviewing the provider

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // More robust check for reviewee - fall back to IDs if user objects aren't available
    const revieweeId = booking.provider_id;
    
    if (!user || !revieweeId) {
      console.error('Missing user or reviewee:', { 
        user: user?.id, 
        revieweeId, 
        booking: booking.id,
        isRequester
      });
      alert('Error: Missing user information. Please try refreshing the page.');
      return;
    }
    
    // Restrict review submission to requesters only
    if (!isRequester) {
      alert('Only service requesters can submit reviews.');
      return;
    }

    console.log('Submitting review:', {
      booking_id: booking.id,
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      rating,
      comment,
    });

    setLoading(true);
    try {
      const result = await dataService.createReview({
        booking_id: booking.id,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating,
        comment,
      });
      console.log('Review submitted successfully:', result);
      
      // Show success popup
      setShowSuccess(true);
      
      // Trigger profile refresh for the reviewee
      window.dispatchEvent(new CustomEvent('timebank:refreshProfileAndDashboard'));
      
      // Wait 1.5 seconds, then close and call callbacks
      setTimeout(() => {
        setShowSuccess(false);
        onReviewed();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert(`Failed to submit review: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Success Popup */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Review Submitted!</h3>
            <p className="text-gray-600">Thank you for your feedback</p>
          </div>
        </div>
      )}

      {/* Main Review Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full">
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Leave a Review</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-1">{booking.service?.title}</h3>
            <p className="text-sm text-gray-600">
              Review for: <span className="font-medium">
                {reviewee?.username || 'Service Provider'}
              </span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="transition hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      value <= rating
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
              Your Review
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this service..."
              rows={6}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
              required
            />
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
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};