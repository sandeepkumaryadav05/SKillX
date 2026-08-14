import mongoose from 'mongoose';

/**
 * SessionNotes — stores private collaborative or personal notes taken during a session.
 */
const sessionNotesSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

sessionNotesSchema.index({ sessionId: 1, userEmail: 1 }, { unique: true });

export default mongoose.model('SessionNotes', sessionNotesSchema);
