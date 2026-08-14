import React, { useState } from 'react';

const ReviewModal = ({ isOpen, onClose, onSubmit, isSubmitting, sessionId, reviewedUserEmail }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a rating.');
      return;
    }

    if (feedback.length > 500) {
      setError('Feedback must be 500 characters or less.');
      return;
    }

    onSubmit({ sessionId, reviewedUserEmail, rating, feedback });
  };

  const handleSkip = () => {
    setRating(0);
    setHoveredRating(0);
    setFeedback('');
    setError('');
    onClose();
  };

  const displayRating = hoveredRating || rating;

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
            ✅
          </div>
          <h2 className="text-xl font-bold text-gray-800">Session Completed!</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Rate your experience with this session</p>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <form id="review-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Star Rating */}
            <div className="text-center">
              <div className="flex justify-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="text-4xl transition-all duration-150 transform hover:scale-110 focus:outline-none"
                    style={{
                      filter: star <= displayRating ? 'none' : 'grayscale(100%) opacity(0.3)',
                    }}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              {displayRating > 0 && (
                <p className="text-sm font-medium text-indigo-600 mt-1">
                  {ratingLabels[displayRating]}
                </p>
              )}
            </div>

            {/* Feedback */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Feedback (Optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder='e.g. "Great explanation of React hooks, very patient and clear!"'
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none h-24 resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-400 text-right mt-1">{feedback.length}/500</p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-[var(--bg-card)] flex justify-between gap-3">
          <button
            type="button"
            onClick={handleSkip}
            className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-gray-700 transition-colors"
          >
            Skip
          </button>
          <button
            type="submit"
            form="review-form"
            disabled={isSubmitting || rating === 0}
            className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
