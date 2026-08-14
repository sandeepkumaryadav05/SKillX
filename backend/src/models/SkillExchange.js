import mongoose from 'mongoose';

/**
 * SkillExchange — represents a user's intent to swap skills.
 * Used by the matching algorithm to compute overlap between offered/wanted skills.
 */
const skillExchangeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, default: '' },
    userId: { type: String, required: true },
    skillOffered: { type: String, required: true },
    skillWanted: { type: String, required: true },
    location: { type: String, default: 'Remote' },
    matchScore: { type: Number, default: 80 }, // Normalized scale: 0-100
  },
  { timestamps: true }
);

const SkillExchange = mongoose.model('SkillExchange', skillExchangeSchema);

export default SkillExchange;
