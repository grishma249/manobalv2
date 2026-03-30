const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Event = require('../models/Event');
const Donation = require('../models/Donation');
const VolunteerParticipation = require('../models/VolunteerParticipation');
const uploadEventImage = require('../middleware/uploadEventImage');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// ==================== ADMIN DASHBOARD ====================
// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard metrics
// @access  Private (Admin only)
router.get('/dashboard', async (req, res) => {
  try {
    // Get user counts by role
    const userCounts = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]);

    const userCountsByRole = {
      admin: 0,
      donor: 0,
      volunteer: 0,
      school: 0,
    };

    userCounts.forEach((item) => {
      userCountsByRole[item._id] = item.count;
    });

    // Get active users count
    const activeUsersCount = await User.countDocuments({ isActive: true });

    // Get pending event requests
    const pendingEventsCount = await Event.countDocuments({ status: 'pending' });

    // Get upcoming events
    const upcomingEventsCount = await Event.countDocuments({
      status: 'approved',
      date: { $gte: new Date() },
    });

    // Get total donations
    const monetaryDonations = await Donation.aggregate([
      { $match: { type: 'monetary' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const physicalDonationsCount = await Donation.countDocuments({ type: 'physical' });

    const totalMonetary = monetaryDonations.length > 0 ? monetaryDonations[0].total : 0;

    // Get total volunteers
    const activeVolunteersCount = await User.countDocuments({
      role: 'volunteer',
      isActive: true,
    });

    // Get recent activities
    const recentEvents = await Event.find()
      .populate('requestedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentDonations = await Donation.find()
      .populate('donor', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      metrics: {
        users: {
          total: await User.countDocuments(),
          active: activeUsersCount,
          byRole: userCountsByRole,
        },
        events: {
          pending: pendingEventsCount,
          upcoming: upcomingEventsCount,
          total: await Event.countDocuments(),
        },
        donations: {
          monetary: {
            total: totalMonetary,
            count: await Donation.countDocuments({ type: 'monetary' }),
          },
          physical: {
            count: physicalDonationsCount,
          },
        },
        volunteers: {
          active: activeVolunteersCount,
          total: userCountsByRole.volunteer,
        },
      },
      recent: {
        events: recentEvents,
        donations: recentDonations,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== USER MANAGEMENT ====================
// @route   GET /api/admin/users
// @desc    Get all users with filtering
// @access  Private (Admin only)
router.get(
  '/users',
  [
    query('role').optional().isIn(['admin', 'donor', 'volunteer', 'school']),
    query('isActive').optional().isBoolean(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { role, isActive, page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      const filter = {};
      if (role) filter.role = role;
      if (isActive !== undefined) filter.isActive = isActive === 'true';

      const users = await User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await User.countDocuments(filter);

      res.json({
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// @route   PATCH /api/admin/users/:id/status
// @desc    Update user account status (activate/deactivate)
// @access  Private (Admin only)
router.patch(
  '/users/:id/status',
  [body('isActive').isBoolean().withMessage('isActive must be a boolean')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { isActive } = req.body;

      // Prevent admin from deactivating themselves
      if (id === req.user._id.toString() && !isActive) {
        return res.status(400).json({ message: 'Cannot deactivate your own account' });
      }

      const user = await User.findByIdAndUpdate(
        id,
        { isActive },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        user,
      });
    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// ==================== EVENT MANAGEMENT ====================
// @route   GET /api/admin/events
// @desc    Get all events with filtering
// @access  Private (Admin only)
router.get(
  '/events',
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

      const filter = {};
      if (status) filter.status = status;

      const events = await Event.find(filter)
        .populate('requestedBy', 'name email schoolName')
        .populate('approvedBy', 'name email')
        .populate('assignedVolunteers', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Event.countDocuments(filter);

      res.json({
        events,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Get events error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// @route   PATCH /api/admin/events/:id/status
// @desc    Approve or reject event request
// @access  Private (Admin only)
router.patch(
  '/events/:id/status',
  [
    body('status')
      .isIn(['approved', 'rejected', 'completed', 'cancelled'])
      .withMessage('Invalid status'),
    body('notes').optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { status, notes } = req.body;

      const event = await Event.findById(id);

      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      event.status = status;
      event.approvedBy = req.user._id;
      if (notes) event.notes = notes;

      await event.save();

      // When marking event as completed, auto-update volunteer attendance
      if (status === 'completed') {
        // Mark all participations (registered/confirmed) as attended
        await VolunteerParticipation.updateMany(
          { event: id, status: { $in: ['registered', 'confirmed'] } },
          { $set: { status: 'attended', attendedAt: new Date() } }
        );

        // For assigned volunteers without a participation record, create one as attended
        const assignedIds = event.assignedVolunteers?.map((v) => v.toString()) || [];
        if (assignedIds.length > 0) {
          const existingParticipations = await VolunteerParticipation.find({
            event: id,
            volunteer: { $in: assignedIds },
          }).select('volunteer');

          const existingVolunteerIds = new Set(
            existingParticipations.map((p) => p.volunteer.toString())
          );
          const missingVolunteerIds = assignedIds.filter(
            (volId) => !existingVolunteerIds.has(volId)
          );

          if (missingVolunteerIds.length > 0) {
            await VolunteerParticipation.insertMany(
              missingVolunteerIds.map((volunteer) => ({
                volunteer,
                event: id,
                status: 'attended',
                registeredAt: new Date(),
                attendedAt: new Date(),
              }))
            );
          }
        }
      }

      const updatedEvent = await Event.findById(id)
        .populate('requestedBy', 'name email schoolName')
        .populate('approvedBy', 'name email');

      res.json({
        message: `Event ${status} successfully`,
        event: updatedEvent,
      });
    } catch (error) {
      console.error('Update event status error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// @route   POST /api/admin/events
// @desc    Create a new event
// @access  Private (Admin only)
router.post(
  '/events',
  uploadEventImage.single('image'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
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
    // When using multipart/form-data, arrays may arrive as strings.
    body('allowedParticipationTypes').optional(),
    body('isPaid').optional(),
    body('price').optional(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // multer fileFilter errors come through as req.fileValidationError
      if (req.fileValidationError) {
        return res.status(400).json({ message: req.fileValidationError });
      }

      const parseAllowedTypes = (input) => {
        if (Array.isArray(input)) return input;
        if (typeof input === 'string') {
          // Accept JSON array string or comma-separated string
          try {
            const parsed = JSON.parse(input);
            if (Array.isArray(parsed)) return parsed;
          } catch (_e) {
            // ignore
          }
          return input
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        }
        return [];
      };

      const allowedTypes = parseAllowedTypes(req.body.allowedParticipationTypes);
      const participationEnum = ['VOLUNTEER', 'DONOR', 'ATTENDEE'];
      const normalizedAllowedTypes =
        allowedTypes.length > 0
          ? allowedTypes.filter((t) => participationEnum.includes(t))
          : ['VOLUNTEER'];

      const isPaid =
        req.body.isPaid === true ||
        req.body.isPaid === 'true' ||
        req.body.isPaid === '1';

      const parsedPrice = isPaid
        ? parseFloat(req.body.price)
        : 0;

      const parsedLatitude = req.body.latitude !== undefined && req.body.latitude !== ''
        ? parseFloat(req.body.latitude)
        : undefined;
      const parsedLongitude = req.body.longitude !== undefined && req.body.longitude !== ''
        ? parseFloat(req.body.longitude)
        : undefined;

      const hasLat = Number.isFinite(parsedLatitude);
      const hasLng = Number.isFinite(parsedLongitude);
      if (hasLat !== hasLng) {
        return res.status(400).json({
          message: 'Both latitude and longitude are required when setting map location',
        });
      }

      const eventData = {
        ...req.body,
        allowedParticipationTypes: normalizedAllowedTypes,
        imageUrl: req.file
          ? (() => {
              const baseUrl = `${req.protocol}://${req.get('host')}`;
              return `${baseUrl}/uploads/events/${req.file.filename}`;
            })()
          : req.body.imageUrl,
        isPaid: Boolean(isPaid),
        price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
        latitude: hasLat ? parsedLatitude : undefined,
        longitude: hasLng ? parsedLongitude : undefined,
        requestedBy: req.user._id, // Admin creates the event
        status: 'approved',
        approvedBy: req.user._id,
      };

      const event = new Event(eventData);
      await event.save();

      const createdEvent = await Event.findById(event._id)
        .populate('requestedBy', 'name email')
        .populate('approvedBy', 'name email');

      res.status(201).json({
        message: 'Event created successfully',
        event: createdEvent,
      });
    } catch (error) {
      console.error('Create event error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// @route   GET /api/admin/events/:id/participations
// @desc    Get all volunteer participations (registrations) for an event
// @access  Private (Admin only)
router.get('/events/:id/participations', async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const participations = await VolunteerParticipation.find({ event: id })
      .populate('volunteer', 'name email')
      .sort({ registeredAt: -1 });

    const pendingCount = participations.filter((p) => p.status === 'pending').length;

    res.json({
      participations,
      pendingCount,
    });
  } catch (error) {
    console.error('Get event participations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/admin/participations/:id/approve
// @desc    Approve a pending volunteer registration
// @access  Private (Admin only)
router.patch('/participations/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;

    const participation = await VolunteerParticipation.findById(id)
      .populate('event', 'title date')
      .populate('volunteer', 'name email');

    if (!participation) {
      return res.status(404).json({ message: 'Participation record not found' });
    }

    if (participation.status !== 'pending') {
      return res.status(400).json({
        message: `Cannot approve: registration is already ${participation.status}`,
      });
    }

    participation.status = 'registered';
    await participation.save();

    res.json({
      message: 'Volunteer registration approved',
      participation,
    });
  } catch (error) {
    console.error('Approve participation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/admin/participations/:id/reject
// @desc    Reject a pending volunteer registration
// @access  Private (Admin only)
router.patch('/participations/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;

    const participation = await VolunteerParticipation.findById(id)
      .populate('event', 'title date')
      .populate('volunteer', 'name email');

    if (!participation) {
      return res.status(404).json({ message: 'Participation record not found' });
    }

    if (participation.status !== 'pending') {
      return res.status(400).json({
        message: `Cannot reject: registration is already ${participation.status}`,
      });
    }

    participation.status = 'cancelled';
    await participation.save();

    res.json({
      message: 'Volunteer registration rejected',
      participation,
    });
  } catch (error) {
    console.error('Reject participation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/admin/events/:id/volunteers
// @desc    Assign volunteers to an event
// @access  Private (Admin only)
router.patch(
  '/events/:id/volunteers',
  [body('volunteerIds').isArray().withMessage('volunteerIds must be an array')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { volunteerIds } = req.body;

      // Verify all IDs are valid volunteers
      const volunteers = await User.find({
        _id: { $in: volunteerIds },
        role: 'volunteer',
        isActive: true,
      });

      if (volunteers.length !== volunteerIds.length) {
        return res.status(400).json({ message: 'Some volunteer IDs are invalid' });
      }

      const event = await Event.findByIdAndUpdate(
        id,
        { assignedVolunteers: volunteerIds },
        { new: true }
      )
        .populate('assignedVolunteers', 'name email')
        .populate('requestedBy', 'name email schoolName');

      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      res.json({
        message: 'Volunteers assigned successfully',
        event,
      });
    } catch (error) {
      console.error('Assign volunteers error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// ==================== DONATION OVERSIGHT ====================
// @route   GET /api/admin/donations
// @desc    Get all donations with filtering
// @access  Private (Admin only)
router.get(
  '/donations',
  [
    query('type').optional().isIn(['monetary', 'physical']),
    query('status').optional().isIn(['pending', 'completed', 'cancelled']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { type, status, page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      const filter = {};
      if (type) filter.type = type;
      if (status) filter.status = status;

      const donations = await Donation.find(filter)
        .populate('donor', 'name email')
        .populate('verifiedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Donation.countDocuments(filter);

      res.json({
        donations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Get donations error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// @route   PATCH /api/admin/donations/:id/status
// @desc    Update donation status (allows editing any status)
// @access  Private (Admin only)
router.patch(
  '/donations/:id/status',
  [
    body('status')
      .isIn(['pending', 'completed', 'cancelled'])
      .withMessage('Status must be pending, completed, or cancelled'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { status } = req.body;

      const donation = await Donation.findByIdAndUpdate(
        id,
        {
          status,
          verifiedBy: req.user._id,
          verifiedAt: new Date(),
        },
        { new: true }
      )
        .populate('donor', 'name email')
        .populate('verifiedBy', 'name email');

      if (!donation) {
        return res.status(404).json({ message: 'Donation not found' });
      }

      res.json({
        message: 'Donation status updated successfully',
        donation,
      });
    } catch (error) {
      console.error('Update donation status error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// ==================== VOLUNTEER OVERSIGHT ====================
// @route   GET /api/admin/volunteers
// @desc    Get all volunteers with participation data
// @access  Private (Admin only)
router.get(
  '/volunteers',
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

      const volunteers = await User.find({ role: 'volunteer' })
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Get participation data for each volunteer
      const volunteersWithParticipation = await Promise.all(
        volunteers.map(async (volunteer) => {
          const participations = await VolunteerParticipation.find({
            volunteer: volunteer._id,
          })
            .populate('event', 'title date location status')
            .sort({ createdAt: -1 });

          const totalEvents = participations.length;
          const attendedEvents = participations.filter(
            (p) => p.status === 'attended'
          ).length;
          const confirmedEvents = participations.filter(
            (p) => p.status === 'confirmed'
          ).length;

          return {
            ...volunteer.toObject(),
            participation: {
              total: totalEvents,
              attended: attendedEvents,
              confirmed: confirmedEvents,
              recent: participations.slice(0, 5),
            },
          };
        })
      );

      const total = await User.countDocuments({ role: 'volunteer' });

      res.json({
        volunteers: volunteersWithParticipation,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Get volunteers error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// @route   GET /api/admin/volunteers/:id/participation
// @desc    Get detailed participation for a volunteer
// @access  Private (Admin only)
router.get('/volunteers/:id/participation', async (req, res) => {
  try {
    const { id } = req.params;

    const volunteer = await User.findById(id).select('-password');

    if (!volunteer || volunteer.role !== 'volunteer') {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    const participations = await VolunteerParticipation.find({ volunteer: id })
      .populate('event', 'title date location status eventType')
      .sort({ createdAt: -1 });

    res.json({
      volunteer,
      participations,
      summary: {
        total: participations.length,
        attended: participations.filter((p) => p.status === 'attended').length,
        confirmed: participations.filter((p) => p.status === 'confirmed').length,
        registered: participations.filter((p) => p.status === 'registered').length,
        pending: participations.filter((p) => p.status === 'pending').length,
      },
    });
  } catch (error) {
    console.error('Get volunteer participation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/admin/participations/:id/attendance
// @desc    Mark volunteer attendance (attended/absent)
// @access  Private (Admin only)
router.patch(
  '/participations/:id/attendance',
  [
    body('status')
      .isIn(['attended', 'absent', 'confirmed'])
      .withMessage('Status must be attended, absent, or confirmed'),
    body('notes').optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { status, notes } = req.body;

      const participation = await VolunteerParticipation.findById(id)
        .populate('event', 'title date')
        .populate('volunteer', 'name email');

      if (!participation) {
        return res.status(404).json({ message: 'Participation record not found' });
      }

      participation.status = status;
      if (notes) participation.notes = notes;

      if (status === 'attended') {
        participation.attendedAt = new Date();
      } else if (status === 'confirmed') {
        participation.confirmedAt = new Date();
      }

      await participation.save();

      res.json({
        message: `Attendance marked as ${status}`,
        participation,
      });
    } catch (error) {
      console.error('Mark attendance error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

module.exports = router;

