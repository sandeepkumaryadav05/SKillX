import mongoose from 'mongoose';

/**
 * Message — an individual text message within a ChatRoom.
 * Tracks read status for unread badge notifications.
 */
const messageSchema = new mongoose.Schema(
  {
    chatRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatRoom',
      required: true,
    },
    senderEmail: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    readStatus: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Message', messageSchema);
