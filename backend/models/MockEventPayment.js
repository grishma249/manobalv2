const mongoose = require('mongoose');

const mockEventPaymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    user: {
      // For public attendees, user can be null/undefined
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'PENDING', 'FAILED'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('MockEventPayment', mockEventPaymentSchema);

