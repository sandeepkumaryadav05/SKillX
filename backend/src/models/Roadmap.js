import mongoose from 'mongoose';

/**
 * Roadmap — stores an AI-generated learning path for a specific user goal.
 * Tracks progress across generated weeks and active status.
 */
const roadmapSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
    },
    goal: {
      type: String,
      required: true,
    },
    generatedRoadmap: {
      type: Object,
      required: true,
    },
    isSaved: {
      type: Boolean,
      default: true,
    },
    progress: {
      type: Number,
      default: 0,
    },
    completedWeeks: {
      type: [Number],
      default: [],
    },
    totalWeeks: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Paused'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Roadmap', roadmapSchema);
