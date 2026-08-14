import mongoose from 'mongoose';

/**
 * Notification — stores alert events for a user (e.g. new message, session request).
 * ReferenceId links the notification to its origin entity for navigation.
 */
const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // Maps to UserProfile.email
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['MESSAGE', 'REQUEST', 'SESSION', 'REVIEW', 'GIG', 'SYSTEM', 'ADMIN'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    referenceId: {
      type: String, // ID of the referenced gig, session, or review
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
