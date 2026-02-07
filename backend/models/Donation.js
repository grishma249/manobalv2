const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['monetary', 'physical'],
      required: [true, 'Donation type is required'],
    },
    amount: {
      type: Number,
      required: function () {
        return this.type === 'monetary';
      },
    },
    currency: {
      type: String,
      default: 'NPR',
    },
    category: {
      type: String,
      required: function () {
        return this.type === 'physical';
      },
    },
    quantity: {
      type: Number,
      required: function () {
        return this.type === 'physical';
      },
    },
    unit: {
      type: String,
      default: 'pieces',
    },
    description: {
      type: String,
    },
    purpose: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    transactionRef: {
      type: String,
    },
    dropoffDetails: {
      type: String,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Donation', donationSchema);

