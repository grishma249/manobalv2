const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const Event = require('../models/Event');
const VolunteerParticipation = require('../models/VolunteerParticipation');

// ==================== EVENT DISCOVERY ====================
// @route   GET /api/volunteers/events
// @desc    Get available events for volunteers (approved events)
// @access  Private (Volunteer only)
router.get(
  '/events',
  authenticate,
  authorize('volunteer'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      // Get approved events that haven't been completed or cancelled
      const filter = {
        status: 'approved',
        date: { $gte: new Date() }, // Only future events
      };

      const events = await Event.find(filter)
        .populate('requestedBy', 'name schoolName')
        .populate('assignedVolunteers', 'name email')
        .sort({ date: 1 }) // Sort by date ascending
        .skip(skip)
        .limit(parseInt(limit));

      // Check which events the volunteer has already registered for
      const volunteerId = req.user._id;
      const registeredEvents = await VolunteerParticipation.find({
        volunteer: volunteerId,
        event: { $in: events.map((e) => e._id) },
      }).select('event status');

      const registeredEventIds = new Set(
        registeredEvents.map((p) => p.event.toString())
      );

      const eventsWithRegistration = events.map((event) => {
        const eventObj = event.toObject();
        const participation = registeredEvents.find(
          (p) => p.event.toString() === event._id.toString()
        );
        eventObj.isRegistered = registeredEventIds.has(event._id.toString());
        eventObj.registrationStatus = participation?.status || null;
        return eventObj;
      });

      const total = await Event.countDocuments(filter);

      res.json({
        events: eventsWithRegistration,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Get volunteer events error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// ==================== EVENT REGISTRATION ====================
// @route   POST /api/volunteers/events/:eventId/register
// @desc    Register for an event
// @access  Private (Volunteer only)
router.post(
  '/events/:eventId/register',
  authenticate,
  authorize('volunteer'),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const volunteerId = req.user._id;

      // Check if event exists and is approved
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      if (event.status !== 'approved') {
        return res
          .status(400)
          .json({ message: 'Event is not available for registration' });
      }

      // Check if already registered
      const existingParticipation = await VolunteerParticipation.findOne({
        volunteer: volunteerId,
        event: eventId,
      });

      if (existingParticipation) {
        return res
          .status(400)
          .json({ message: 'You are already registered for this event' });
      }

      // Create participation record
      const participation = new VolunteerParticipation({
        volunteer: volunteerId,
        event: eventId,
        status: 'registered',
        registeredAt: new Date(),
      });

      await participation.save();

      const populatedParticipation = await VolunteerParticipation.findById(
        participation._id
      )
        .populate('volunteer', 'name email')
        .populate('event', 'title date location');

      res.status(201).json({
        message: 'Successfully registered for event',
        participation: populatedParticipation,
      });
    } catch (error) {
      console.error('Register for event error:', error);
      if (error.code === 11000) {
        return res
          .status(400)
          .json({ message: 'You are already registered for this event' });
      }
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// ==================== PARTICIPATION HISTORY ====================
// @route   GET /api/volunteers/participations
// @desc    Get volunteer's participation history
// @access  Private (Volunteer only)
router.get(
  '/participations',
  authenticate,
  authorize('volunteer'),
  [
    query('status').optional().isIn(['registered', 'confirmed', 'attended', 'absent', 'cancelled']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status, page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;
      const volunteerId = req.user._id;

      const filter = { volunteer: volunteerId };
      if (status) filter.status = status;

      const participations = await VolunteerParticipation.find(filter)
        .populate('event', 'title date location eventType status')
        .sort({ registeredAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await VolunteerParticipation.countDocuments(filter);

      // Calculate summary statistics
      const allParticipations = await VolunteerParticipation.find({
        volunteer: volunteerId,
      }).populate('event', 'date');

      const summary = {
        total: allParticipations.length,
        registered: allParticipations.filter((p) => p.status === 'registered').length,
        confirmed: allParticipations.filter((p) => p.status === 'confirmed').length,
        attended: allParticipations.filter((p) => p.status === 'attended').length,
        absent: allParticipations.filter((p) => p.status === 'absent').length,
        cancelled: allParticipations.filter((p) => p.status === 'cancelled').length,
      };

      res.json({
        participations,
        summary,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Get participations error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

module.exports = router;

