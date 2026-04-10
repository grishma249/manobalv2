const express = require('express');
const { body, query, validationResult } = require('express-validator');
const ContactMessage = require('../models/ContactMessage');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/contact
// @desc    Submit a public contact message
// @access  Public
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('message')
      .trim()
      .isLength({ min: 10, max: 5000 })
      .withMessage('Message must be between 10 and 5000 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, subject, message } = req.body;
      const saved = await ContactMessage.create({ name, email, subject, message });

      return res.status(201).json({
        message: 'Message sent successfully',
        contactMessage: saved,
      });
    } catch (error) {
      console.error('Submit contact message error:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// @route   GET /api/contact/admin/messages
// @desc    Get contact messages for admin inbox
// @access  Private (Admin only)
router.get(
  '/admin/messages',
  authenticate,
  authorize('admin'),
  [
    query('status').optional().isIn(['unread', 'read', 'resolved']),
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
      const skip = (Number(page) - 1) * Number(limit);
      const filter = {};
      if (status) filter.status = status;

      const [messages, total] = await Promise.all([
        ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
        ContactMessage.countDocuments(filter),
      ]);

      return res.json({
        messages,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Get contact messages error:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// @route   PATCH /api/contact/admin/messages/:id/status
// @desc    Update message status (read/resolved/unread)
// @access  Private (Admin only)
router.patch(
  '/admin/messages/:id/status',
  authenticate,
  authorize('admin'),
  [body('status').isIn(['unread', 'read', 'resolved']).withMessage('Invalid status')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { status } = req.body;

      const updates = { status };
      if (status === 'read') updates.readAt = new Date();
      if (status === 'resolved') {
        updates.readAt = updates.readAt || new Date();
        updates.resolvedAt = new Date();
      }
      if (status === 'unread') {
        updates.readAt = undefined;
        updates.resolvedAt = undefined;
      }

      const message = await ContactMessage.findByIdAndUpdate(id, updates, { new: true });
      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }

      return res.json({ message: 'Status updated', contactMessage: message });
    } catch (error) {
      console.error('Update contact status error:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

module.exports = router;

