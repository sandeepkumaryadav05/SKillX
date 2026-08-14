import mongoose from 'mongoose';

/**
 * ChatRoom — represents a direct messaging channel between users.
 * Rooms can be stand-alone or linked to a specific gig/exchange for context.
 */
const chatRoomSchema = new mongoose.Schema(
  {
    participants: {
      type: [String],
      required: true,
    },
    referenceId: {
      type: String, // Links to a Gig or ExchangeRequest ID for context
      required: false,
    },
    referenceType: {
      type: String, // 'gig' or 'exchange'
      required: false,
    },
    title: {
      type: String,
      required: false,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model('ChatRoom', chatRoomSchema);
