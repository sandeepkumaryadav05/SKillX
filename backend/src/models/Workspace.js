import mongoose from 'mongoose';

/**
 * Workspace — collaborative environment tied to a specific ChatRoom.
 * Supports shared resources and task management for participants.
 */
const workspaceSchema = new mongoose.Schema(
  {
    chatRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatRoom',
      required: true,
      unique: true, // One workspace per chat room — prevents duplicates
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      default: null,
    },
    participants: {
      type: [String],
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Workspace', workspaceSchema);
