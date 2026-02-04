const mongoose = require('mongoose');

const volunteerParticipationSchema = new mongoose.Schema(
  {
    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    status: {
      type: String,
      enum: ['registered', 'confirmed', 'attended', 'absent', 'cancelled'],
      default: 'registered',
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    confirmedAt: {
      type: Date,
    },
    attendedAt: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate registrations
volunteerParticipationSchema.index({ volunteer: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('VolunteerParticipation', volunteerParticipationSchema);

