const express = require('express');
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');
const EventParticipation = require('../models/EventParticipation');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');

const router = express.Router();

// ==================== PUBLIC EVENT LISTING ====================
// @route   GET /api/events/public
// @desc    Get publicly visible upcoming events (approved)
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const now = new Date();

    const events = await Event.find({
      status: 'approved',
      date: { $gte: now },
    })
      .sort({ date: 1 })
      .select('title description eventType date location allowedParticipationTypes');

    res.json({ events });
  } catch (error) {
    console.error('Get public events error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== MY EVENT PARTICIPATIONS ====================
// @route   GET /api/events/participations/me
// @desc    Get current user's event participations (donor/attendee)
// @access  Private
router.get('/participations/me', authenticate, async (req, res) => {
  try {
    const participations = await EventParticipation.find({ user: req.user._id })
      .populate('event', 'title date location eventType')
      .sort({ createdAt: -1 });

    const summary = {
      total: participations.length,
      donor: participations.filter((p) => p.participationType === 'DONOR').length,
      attendee: participations.filter((p) => p.participationType === 'ATTENDEE').length,
    };

    res.json({ participations, summary });
  } catch (error) {
    console.error('Get my participations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== EVENT DETAILS (PUBLIC) ====================
// @route   GET /api/events/:id
// @desc    Get single event details for public view
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id).select(
      'title description eventType date location allowedParticipationTypes status'
    );

    if (!event || event.status !== 'approved') {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ event });
  } catch (error) {
    console.error('Get event details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== GENERIC PARTICIPATION ====================
// @route   POST /api/events/:id/participate
// @desc    Register as donor or attendee for an event
// @access  Public (auth optional)
router.post(
  '/:id/participate',
  optionalAuthenticate,
  [
    body('participationType')
      .isIn(['DONOR', 'ATTENDEE'])
      .withMessage('participationType must be DONOR or ATTENDEE'),
    body('name').optional().trim(),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('phone').optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { participationType } = req.body;

      const event = await Event.findById(id);
      if (!event || event.status !== 'approved') {
        return res.status(404).json({ message: 'Event not found' });
      }

      // Ensure this event allows the requested participation type
      if (
        !Array.isArray(event.allowedParticipationTypes) ||
        !event.allowedParticipationTypes.includes(participationType)
      ) {
        return res.status(400).json({
          message: 'This type of participation is not available for this event',
        });
      }

      // If user is authenticated, prefer profile info
      let userId = null;
      let name = req.body.name;
      let email = req.body.email;
      let phone = req.body.phone;

      if (req.user) {
        userId = req.user._id;
        name = name || req.user.name;
        email = email || req.user.email;
      }

      if (!userId && (!name || !email)) {
        return res.status(400).json({
          message: 'Name and email are required for public participation',
        });
      }

      const participation = new EventParticipation({
        event: event._id,
        user: userId || undefined,
        name,
        email,
        phone,
        participationType,
        status: 'registered',
      });

      await participation.save();

      res.status(201).json({
        message: 'Successfully registered for this event',
        participation,
      });
    } catch (error) {
      console.error('Event participate error:', error);
      if (error.code === 11000) {
        return res
          .status(400)
          .json({ message: 'You are already registered for this event in this way' });
      }
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// ==================== EVENT PARTICIPANT LIST (ADMIN) ====================
// @route   GET /api/events/:id/participants
// @desc    Get all participants for an event
// @access  Private (Admin)
router.get('/:id/participants', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const participants = await EventParticipation.find({ event: id })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ event, participants });
  } catch (error) {
    console.error('Get event participants error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

