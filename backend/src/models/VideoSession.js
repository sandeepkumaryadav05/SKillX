import mongoose from 'mongoose';

/**
 * VideoSession — tracks the active state and duration of a WebRTC call.
 * Maps 1:1 with a scheduled Session entity.
 */
const videoSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      unique: true,
    },
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    participants: {
      type: [String],
      required: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'active', 'ended'],
      default: 'waiting',
    },
    startedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model('VideoSession', videoSessionSchema);
