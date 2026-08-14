// src/models/GigApplication.js
import mongoose from 'mongoose';

/**
 * GigApplication — represents a user's bid/application for a specific Gig.
 * Tracks the applicant's message and the owner's decision (pending/accepted/rejected).
 */
const gigApplicationSchema = new mongoose.Schema(
  {
    gigId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gig',
      required: true,
    },
    gigTitle: { type: String, required: true },

    gigOwnerEmail: { type: String, required: true },

    applicantEmail: { type: String, required: true },

    message: { type: String, default: '' },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const GigApplication = mongoose.model('GigApplication', gigApplicationSchema);

export default GigApplication;
