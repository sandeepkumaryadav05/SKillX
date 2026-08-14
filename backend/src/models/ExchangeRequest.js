import mongoose from 'mongoose'

/**
 * ExchangeRequest — tracks a single skill swap proposal between two users.
 * A request is always initiated by sender toward a specific exchange profile
 * posted by the receiver. Status transitions: pending → accepted | rejected.
 */
const exchangeRequestSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    toUserId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    exchangeId: {
      type: String,
    },

    fromEmail: {
      type: String,
      trim: true,
    },

    toEmail: {
      type: String,
      trim: true,
    },

    message: {
      type: String,
      default: '',
    },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
      index: true,
    },

    chatRoomId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
)

const ExchangeRequest = mongoose.model(
  'ExchangeRequest',
  exchangeRequestSchema
)

export default ExchangeRequest
