const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const Event = require('../models/Event');

// ==================== EVENT REQUEST ====================
// @route   POST /api/schools/events/request
// @desc    Request a new event
// @access  Private (School only)
router.post(
  '/events/request',
  authenticate,
  authorize('school'),
  [
    body('title').trim().notEmpty().withMessage('Event title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('eventType')
      .isIn(['workshop', 'awareness', 'training', 'other'])
      .withMessage('Invalid event type'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('numberOfStudents')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Number of students must be a positive integer'),
    body('targetAudience').optional().trim(),
    body('notes').optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const eventData = {
        ...req.body,
        requestedBy: req.user._id,
        status: 'pending',
      };

      const event = new Event(eventData);
      await event.save();

      const createdEvent = await Event.findById(event._id)
        .populate('requestedBy', 'name email schoolName')
        .populate('assignedVolunteers', 'name email');

      res.status(201).json({
        message: 'Event request submitted successfully',
        event: createdEvent,
      });
    } catch (error) {
      console.error('Request event error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// ==================== VIEW OWN REQUESTS ====================
// @route   GET /api/schools/events
// @desc    Get all events requested by this school
// @access  Private (School only)
router.get(
  '/events',
  authenticate,
  authorize('school'),
  [
    query('status').optional().isIn(['pending', 'approved', 'rejected', 'completed', 'cancelled']),
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
      const schoolId = req.user._id;

      const filter = { requestedBy: schoolId };
      if (status) filter.status = status;

      const events = await Event.find(filter)
        .populate('requestedBy', 'name email schoolName')
        .populate('approvedBy', 'name email')
        .populate('assignedVolunteers', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Event.countDocuments(filter);

      // Calculate summary statistics
      const allEvents = await Event.find({ requestedBy: schoolId });
      const summary = {
        total: allEvents.length,
        pending: allEvents.filter((e) => e.status === 'pending').length,
        approved: allEvents.filter((e) => e.status === 'approved').length,
        rejected: allEvents.filter((e) => e.status === 'rejected').length,
        completed: allEvents.filter((e) => e.status === 'completed').length,
        cancelled: allEvents.filter((e) => e.status === 'cancelled').length,
      };

      res.json({
        events,
        summary,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Get school events error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

module.exports = router;

