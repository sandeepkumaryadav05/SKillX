import mongoose from 'mongoose';
import { PERMISSIONS } from '../services/permissionService.js';

/**
 * UserProfile — central identity for a user.
 * Stores global stats, permissions, and availability preferences.
 */
const userProfileSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    permissions: { 
      type: [String], 
      enum: Object.values(PERMISSIONS),
      default: [] 
    },
    location: { type: String, default: '' },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '' },
    skills: { type: [String], default: [], index: true },
    socialLinks: {
      type: [
        {
          type: { type: String, enum: ['github', 'linkedin', 'portfolio', 'twitter'], required: true },
          url: { type: String, required: true },
          label: { type: String }
        }
      ],
      default: []
    },
    stats: {
      gigsPosted: { type: Number, default: 0 },
      gigsCompleted: { type: Number, default: 0 },
      skillExchanges: { type: Number, default: 0 },
      skillExchangesCompleted: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
    },
    availability: [
      {
        day: { type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
        slots: [
          {
            startTime: String,
            endTime: String
          }
        ]
      }
    ],
    customAvailability: [
      {
        date: { type: String, required: true }, // Format: YYYY-MM-DD
        slots: [
          {
            startTime: String,
            endTime: String
          }
        ]
      }
    ]
  },
  { timestamps: true }
);

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

export default UserProfile;
