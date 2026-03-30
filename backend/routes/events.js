const express = require('express');
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');
const EventParticipation = require('../models/EventParticipation');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const MockEventPayment = require('../models/MockEventPayment');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const router = express.Router();

// ==================== PUBLIC EVENT LISTING ====================
// @route   GET /api/events/public
// @desc    Get publicly visible upcoming events (approved)
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const now = new Date();

    const events = await Event.find({
      status: 'approved',
      date: { $gte: now },
    })
      .sort({ date: 1 })
      .select(
        'title description eventType date location latitude longitude allowedParticipationTypes imageUrl isPaid price'
      )
      .lean();

    const normalizeImageUrl = (imageUrl) => {
      if (!imageUrl) return imageUrl;
      if (imageUrl.startsWith('/uploads/')) return `${baseUrl}${imageUrl}`;
      return imageUrl;
    };

    res.json({
      events: events.map((e) => ({
        ...e,
        imageUrl: normalizeImageUrl(e.imageUrl),
        isPaid: Boolean(e.isPaid),
        price: Number.isFinite(Number(e.price)) ? Number(e.price) : 0,
      })),
    });
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
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const event = await Event.findById(id).select(
      'title description eventType date location latitude longitude allowedParticipationTypes status imageUrl isPaid price'
    );

    if (!event || event.status !== 'approved') {
      return res.status(404).json({ message: 'Event not found' });
    }

    const eventObj = event.toObject ? event.toObject() : event;
    if (eventObj.imageUrl && eventObj.imageUrl.startsWith('/uploads/')) {
      eventObj.imageUrl = `${baseUrl}${eventObj.imageUrl}`;
    }
    eventObj.isPaid = Boolean(eventObj.isPaid);
    eventObj.price = Number.isFinite(Number(eventObj.price)) ? Number(eventObj.price) : 0;
    res.json({ event: eventObj });
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
    body('paymentSessionId').optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { participationType, paymentSessionId } = req.body;

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

      // If user is authenticated, prefer profile info. For paid public flows,
      // we'll also be able to pull details from the payment session metadata.
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
        const isPaidAttendee =
          participationType === 'ATTENDEE' && event.isPaid && paymentSessionId;

        // For paid attendee flows, details can be taken from payment session metadata.
        if (!isPaidAttendee) {
          return res.status(400).json({
            message: 'Name and email are required for public participation',
          });
        }
      }

      // Paid attendee enforcement: create participation ONLY if payment is completed.
      if (participationType === 'ATTENDEE' && event.isPaid) {
        if (!paymentSessionId) {
          return res.status(400).json({
            message: 'paymentSessionId is required for paid event attendance',
          });
        }

        const payment = await MockEventPayment.findOne({
          paymentId: paymentSessionId,
          event: event._id,
        });

        if (!payment || payment.status !== 'COMPLETED') {
          return res.status(400).json({
            message: 'Payment not completed. Participation was not created.',
          });
        }
      }

      const participation = new EventParticipation({
        event: event._id,
        user: userId || undefined,
        name,
        email,
        phone,
        participationType,
        status: 'registered',
        paymentStatus: participationType === 'ATTENDEE' && event.isPaid ? 'COMPLETED' : undefined,
        paymentId: participationType === 'ATTENDEE' && event.isPaid ? paymentSessionId : undefined,
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

// ==================== PAID ATTENDEE PAYMENT START ====================
// @route   POST /api/events/:id/attend/start
// @desc    Start payment for paid attendee events (mock payment + delay)
// @access  Public (auth optional)
router.post(
  '/:id/attend/start',
  optionalAuthenticate,
  [
    body('name').optional().trim(),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('phone').optional().trim(),
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, phone } = req.body;

      const event = await Event.findById(id);
      if (!event || event.status !== 'approved') {
        return res.status(404).json({ message: 'Event not found' });
      }

      if (!Array.isArray(event.allowedParticipationTypes) || !event.allowedParticipationTypes.includes('ATTENDEE')) {
        return res.status(400).json({
          message: 'This event is not accepting attendee participation',
        });
      }

      if (!event.isPaid) {
        return res.json({ paymentRequired: false });
      }

      // Logged-in attendees will have req.user; public users must provide name/email.
      let userId = null;
      let resolvedName = name;
      let resolvedEmail = email;
      let resolvedPhone = phone;

      if (req.user) {
        userId = req.user._id;
        resolvedName = resolvedName || req.user.name;
        resolvedEmail = resolvedEmail || req.user.email;
      }

      if (!userId && (!resolvedName || !resolvedEmail)) {
        return res.status(400).json({
          message: 'Name and email are required for public paid attendance',
        });
      }

      if (!event.price || Number(event.price) <= 0) {
        return res.status(400).json({ message: 'Invalid event price' });
      }

      const paymentSessionId = `MOCKTX-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const mockPayment = await MockEventPayment.create({
        paymentId: paymentSessionId,
        event: event._id,
        user: userId || undefined,
        status: 'PENDING',
      });

      const delayMs = (() => {
        const raw = process.env.MOCK_PAYMENT_DELAY_MS;
        const parsed = raw ? parseInt(raw, 10) : NaN;
        if (Number.isFinite(parsed) && parsed >= 0) return parsed;
        return 1000 + Math.floor(Math.random() * 1000); // 1-2 seconds
      })();

      await delay(delayMs);

      const failRate = (() => {
        const raw = process.env.MOCK_PAYMENT_FAIL_RATE;
        const parsed = raw ? parseFloat(raw) : NaN;
        if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) return parsed;
        return 0.15;
      })();

      const shouldFail = Math.random() < failRate;

      mockPayment.status = shouldFail ? 'FAILED' : 'COMPLETED';
      await mockPayment.save();

      if (shouldFail) {
        return res.status(400).json({
          paymentRequired: true,
          paymentSessionId: paymentSessionId,
          message: 'Mock payment failed. Please try again.',
        });
      }

      // In mock mode, payment is "completed" before we allow participation creation.
      res.json({
        paymentRequired: true,
        paymentSessionId: paymentSessionId,
        delayMs,
      });
    } catch (error) {
      console.error('Start payment error:', error);
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

