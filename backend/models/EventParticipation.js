const mongoose = require('mongoose');

const eventParticipationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    // Optional – null for public (unauthenticated) participants
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
    participationType: {
      type: String,
      enum: ['VOLUNTEER', 'DONOR', 'ATTENDEE'],
      required: true,
    },
    status: {
      type: String,
      enum: ['registered', 'attended', 'cancelled'],
      default: 'registered',
    },
    paymentStatus: {
      type: String,
      enum: ['COMPLETED', 'PENDING', 'FAILED'],
    },
    paymentId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Avoid duplicate participation records for the same user/event/type
eventParticipationSchema.index(
  { event: 1, user: 1, participationType: 1 },
  { unique: true, partialFilterExpression: { user: { $exists: true } } }
);

module.exports = mongoose.model('EventParticipation', eventParticipationSchema);

