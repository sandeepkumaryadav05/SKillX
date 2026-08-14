import mongoose from 'mongoose';

/**
 * Session — tracks a scheduled skill exchange or coaching meeting between users.
 * Supports metadata for video/in-person modes and participant roles.
 */
const sessionSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
    },
    participants: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => v.length === 2,
        message: 'A session must have exactly 2 participants.',
      },
    },
    chatRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatRoom',
      required: true,
    },
    requestedBy: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String, // Kept for legacy compatibility
      required: true,
    },
    startTime: {
      type: String, // Format HH:mm
    },
    endTime: {
      type: String, // Format HH:mm
    },
    duration: {
      type: String,
      enum: ['30 mins', '60 mins', '90 mins', '120 mins'],
      default: '60 mins',
    },
    mode: {
      type: String,
      enum: ['Remote', 'Video Session', 'In Person', 'Chat Session'],
      default: 'Remote',
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected', 'Declined', 'Scheduled', 'Completed', 'Cancelled', 'Rescheduled'],
      default: 'Pending',
    },
    matchesAvailability: {
      type: Boolean,
      default: false,
    },
    conflictDetected: {
      type: Boolean,
      default: false,
    },
    reviewedBy: {
      type: [String],
      default: [],
    },
    // Note: exchangeRoles uses Mixed (not Map) because Mongoose Maps forbid dots in keys
    // and email addresses contain dots. Mixed stores the object as-is.
    exchangeRoles: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model('Session', sessionSchema);
