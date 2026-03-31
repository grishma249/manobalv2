const mongoose = require('mongoose');

const esewaPaymentSchema = new mongoose.Schema(
  {
    transactionUuid: {
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
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    participationType: {
      type: String,
      enum: ['ATTENDEE'],
      default: 'ATTENDEE',
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    productCode: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    transactionCode: {
      type: String,
    },
    verificationPayload: {
      type: Object,
    },
    participation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EventParticipation',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EsewaPayment', esewaPaymentSchema);

