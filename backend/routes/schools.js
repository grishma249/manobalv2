const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const Event = require('../models/Event');
const uploadEventImage = require('../middleware/uploadEventImage');

// ==================== GEOCODE (Nominatim proxy) ====================
// @route   GET /api/schools/geocode/search
// @desc    Same as admin geocode; used by the school event request map picker
// @access  Private (School only)
router.get(
  '/geocode/search',
  authenticate,
  authorize('school'),
  [
    query('q').trim().notEmpty().withMessage('Query is required'),
    query('limit').optional().isInt({ min: 1, max: 10 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const q = req.query.q;
      const limit = Math.min(parseInt(req.query.limit, 10) || 5, 10);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        q
      )}&limit=${limit}`;

      const nominatimRes = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent':
            process.env.NOMINATIM_USER_AGENT ||
            'ManobalNGO-School/1.0 (https://github.com/manobal; contact@manobalnepal.org)',
        },
      });

      if (!nominatimRes.ok) {
        return res.status(502).json({ message: 'Geocoding service unavailable' });
      }

      const data = await nominatimRes.json();
      res.json({ results: Array.isArray(data) ? data : [] });
    } catch (error) {
      console.error('School geocode search error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// ==================== EVENT REQUEST ====================
// @route   POST /api/schools/events/request
// @desc    Request a new event
// @access  Private (School only)
router.post(
  '/events/request',
  authenticate,
  authorize('school'),
  uploadEventImage.single('image'),
  [
    body('title').trim().notEmpty().withMessage('Event title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('eventType')
      .isIn(['workshop', 'awareness', 'training', 'other'])
      .withMessage('Invalid event type'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('latitude')
      .optional({ checkFalsy: true })
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    body('longitude')
      .optional({ checkFalsy: true })
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
    body('numberOfStudents')
      .optional({ checkFalsy: true })
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

      if (req.fileValidationError) {
        return res.status(400).json({ message: req.fileValidationError });
      }

      const parsedLatitude =
        req.body.latitude !== undefined && req.body.latitude !== ''
          ? parseFloat(req.body.latitude)
          : undefined;
      const parsedLongitude =
        req.body.longitude !== undefined && req.body.longitude !== ''
          ? parseFloat(req.body.longitude)
          : undefined;

      const hasLat = Number.isFinite(parsedLatitude);
      const hasLng = Number.isFinite(parsedLongitude);
      if (hasLat !== hasLng) {
        return res.status(400).json({
          message: 'Both latitude and longitude are required when setting map location',
        });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;

      const numberOfStudents =
        req.body.numberOfStudents !== undefined && req.body.numberOfStudents !== ''
          ? parseInt(req.body.numberOfStudents, 10)
          : 0;

      const eventData = {
        title: req.body.title.trim(),
        description: req.body.description.trim(),
        eventType: req.body.eventType,
        date: req.body.date,
        location: req.body.location.trim(),
        numberOfStudents: Number.isFinite(numberOfStudents) ? numberOfStudents : 0,
        targetAudience: req.body.targetAudience?.trim() || undefined,
        notes: req.body.notes?.trim() || undefined,
        requestedBy: req.user._id,
        status: 'pending',
        allowedParticipationTypes: ['VOLUNTEER'],
        isPaid: false,
        price: 0,
      };

      if (hasLat) {
        eventData.latitude = parsedLatitude;
        eventData.longitude = parsedLongitude;
      }

      if (req.file) {
        eventData.imageUrl = `${baseUrl}/uploads/events/${req.file.filename}`;
      }

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

      const baseUrl = `${req.protocol}://${req.get('host')}`;

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

      const normalizeImageUrl = (imageUrl) => {
        if (!imageUrl) return imageUrl;
        if (imageUrl.startsWith('/uploads/')) return `${baseUrl}${imageUrl}`;
        return imageUrl;
      };

      const eventsWithImages = events.map((e) => {
        const obj = e.toObject ? e.toObject() : e;
        obj.imageUrl = normalizeImageUrl(obj.imageUrl);
        return obj;
      });

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
        events: eventsWithImages,
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

