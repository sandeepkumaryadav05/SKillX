import mongoose from 'mongoose';

/**
 * Review — represents a post-session rating and feedback entry.
 * Enforces a one-review-per-session-per-user limit via compound index.
 */
const reviewSchema = new mongoose.Schema(
  {
    reviewerEmail: {
      type: String,
      required: true,
    },
    reviewedUserEmail: {
      type: String,
      required: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
      default: '',
      maxlength: 500,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ reviewerEmail: 1, sessionId: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);
