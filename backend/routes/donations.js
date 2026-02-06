const express = require('express')
const { body, validationResult } = require('express-validator')
const { authenticate, authorize } = require('../middleware/auth')
const Donation = require('../models/Donation')

const router = express.Router()

// All donation routes here require authentication
router.use(authenticate)

// ==================== DONOR DONATION CREATION ====================
// @route   POST /api/donations
// @desc    Create a new donation (donor only)
// @access  Private
router.post(
  '/',
  authorize('donor'),
  [
    body('type').isIn(['monetary', 'physical']).withMessage('Invalid donation type'),
    body('amount')
      .if(body('type').equals('monetary'))
      .isFloat({ gt: 0 })
      .withMessage('Amount must be greater than 0'),
    body('category')
      .if(body('type').equals('physical'))
      .trim()
      .notEmpty()
      .withMessage('Category is required for physical donations'),
    body('quantity')
      .if(body('type').equals('physical'))
      .isInt({ gt: 0 })
      .withMessage('Quantity must be greater than 0'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { type, amount, currency, category, quantity, unit, description, purpose, transactionRef, dropoffDetails } =
        req.body

      const donation = new Donation({
        donor: req.user._id,
        type,
        amount: type === 'monetary' ? amount : undefined,
        currency: currency || 'NPR',
        category: type === 'physical' ? category : undefined,
        quantity: type === 'physical' ? quantity : undefined,
        unit: unit || 'pieces',
        description,
        purpose,
        transactionRef,
        dropoffDetails,
        status: 'pending',
      })

      await donation.save()

      const populatedDonation = await Donation.findById(donation._id).populate('donor', 'name email')

      res.status(201).json({
        message: 'Donation recorded successfully',
        donation: populatedDonation,
      })
    } catch (error) {
      console.error('Create donation error:', error)
      res.status(500).json({ message: 'Server error', error: error.message })
    }
  }
)

// ==================== DONOR DONATION HISTORY ====================
// @route   GET /api/donations/me
// @desc    Get current donor's donations and summary
// @access  Private (Donor only)
router.get('/me', authorize('donor'), async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user._id })
      .sort({ createdAt: -1 })
      .lean()

    const summary = donations.reduce(
      (acc, donation) => {
        if (donation.type === 'monetary' && typeof donation.amount === 'number') {
          acc.totalMonetary += donation.amount
          acc.monetaryCount += 1
        }
        if (donation.type === 'physical' && typeof donation.quantity === 'number') {
          acc.totalItems += donation.quantity
          acc.physicalCount += 1
        }
        return acc
      },
      { totalMonetary: 0, totalItems: 0, monetaryCount: 0, physicalCount: 0 }
    )

    res.json({ donations, summary })
  } catch (error) {
    console.error('Get donor donations error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

module.exports = router


