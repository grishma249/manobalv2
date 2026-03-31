const express = require('express');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const Event = require('../models/Event');
const EventParticipation = require('../models/EventParticipation');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const EsewaPayment = require('../models/EsewaPayment');
const { sendEventRegistrationEmail } = require('../services/emailService');

const router = express.Router();

const getEsewaConfig = () => ({
  gatewayUrl:
    process.env.ESEWA_GATEWAY_URL ||
    'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
  statusUrl:
    process.env.ESEWA_STATUS_URL ||
    'https://rc-epay.esewa.com.np/api/epay/transaction/status/',
  productCode: process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST',
  secretKey: process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q',
});

const buildEsewaSignature = ({ totalAmount, transactionUuid, productCode, secretKey }) => {
  const signedValue = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  return crypto.createHmac('sha256', secretKey).update(signedValue).digest('base64');
};

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

// ==================== ESEWA PAYMENT CONFIRM ====================
// @route   POST /api/events/payments/esewa/confirm
// @desc    Verify eSewa success payload and finalize attendee registration
// @access  Public (auth optional, verification is server-side)
router.post(
  '/payments/esewa/confirm',
  [body('data').trim().notEmpty().withMessage('data is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      let decoded;
      try {
        const decodedRaw = Buffer.from(req.body.data, 'base64').toString('utf8');
        decoded = JSON.parse(decodedRaw);
      } catch (_e) {
        return res.status(400).json({ message: 'Invalid eSewa payload' });
      }

      const transactionUuid = decoded?.transaction_uuid;
      const totalAmount = Number(decoded?.total_amount);
      const productCode = decoded?.product_code;
      const status = decoded?.status;
      const transactionCode = decoded?.transaction_code;

      if (!transactionUuid || !productCode || !Number.isFinite(totalAmount)) {
        return res.status(400).json({ message: 'Incomplete eSewa success data' });
      }

      const paymentAttempt = await EsewaPayment.findOne({ transactionUuid }).populate('event');
      if (!paymentAttempt) {
        return res.status(404).json({ message: 'Payment attempt not found' });
      }

      if (paymentAttempt.status === 'COMPLETED' && paymentAttempt.participation) {
        const existing = await EventParticipation.findById(paymentAttempt.participation);
        return res.json({
          message: 'Registration already confirmed',
          participation: existing,
          eventId: paymentAttempt.event?._id,
        });
      }

      const { statusUrl, productCode: expectedProductCode } = getEsewaConfig();
      if (productCode !== expectedProductCode || productCode !== paymentAttempt.productCode) {
        paymentAttempt.status = 'FAILED';
        await paymentAttempt.save();
        return res.status(400).json({ message: 'Invalid product code from payment response' });
      }

      if (Number(totalAmount) !== Number(paymentAttempt.totalAmount)) {
        paymentAttempt.status = 'FAILED';
        await paymentAttempt.save();
        return res.status(400).json({ message: 'Invalid payment amount from payment response' });
      }

      if (status !== 'COMPLETE') {
        paymentAttempt.status = 'FAILED';
        paymentAttempt.verificationPayload = decoded;
        await paymentAttempt.save();
        return res.status(400).json({ message: 'Payment not completed' });
      }

      // Critical server-side verification from eSewa status API (prevents frontend tampering).
      const statusQuery = new URLSearchParams({
        product_code: productCode,
        total_amount: String(totalAmount),
        transaction_uuid: transactionUuid,
      });
      const verificationRes = await fetch(`${statusUrl}?${statusQuery.toString()}`);
      const verificationData = await verificationRes.json();

      if (verificationData?.status !== 'COMPLETE') {
        paymentAttempt.status = 'FAILED';
        paymentAttempt.verificationPayload = verificationData;
        await paymentAttempt.save();
        return res.status(400).json({ message: 'eSewa verification failed' });
      }

      const eventDoc = paymentAttempt.event || (await Event.findById(paymentAttempt.event));
      if (!eventDoc) {
        return res.status(404).json({ message: 'Event not found for this payment' });
      }

      let participation = null;
      if (paymentAttempt.user) {
        participation = await EventParticipation.findOne({
          event: eventDoc._id,
          user: paymentAttempt.user,
          participationType: 'ATTENDEE',
        });
      }

      if (!participation) {
        participation = await EventParticipation.create({
          event: eventDoc._id,
          user: paymentAttempt.user || undefined,
          name: paymentAttempt.name,
          email: paymentAttempt.email,
          phone: paymentAttempt.phone,
          participationType: 'ATTENDEE',
          status: 'registered',
          paymentStatus: 'COMPLETED',
          paymentId: paymentAttempt.transactionUuid,
        });
      }

      paymentAttempt.status = 'COMPLETED';
      paymentAttempt.transactionCode = transactionCode;
      paymentAttempt.verificationPayload = verificationData;
      paymentAttempt.participation = participation._id;
      await paymentAttempt.save();

      void sendEventRegistrationEmail({
        to: paymentAttempt.email,
        userName: paymentAttempt.name,
        eventName: eventDoc.title,
        eventDate: eventDoc.date,
        eventLocation: eventDoc.location,
        participationType: 'ATTENDEE',
        paymentConfirmed: true,
        paymentReference: paymentAttempt.transactionUuid,
      });

      res.json({
        message: 'Registration confirmed successfully',
        participation,
        eventId: eventDoc._id,
      });
    } catch (error) {
      console.error('eSewa confirm error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// ==================== ESEWA PAYMENT FAILURE MARK ====================
// @route   POST /api/events/payments/esewa/failure
// @desc    Mark pending eSewa payment as failed (best effort)
// @access  Public
router.post('/payments/esewa/failure', [body('transaction_uuid').optional().trim()], async (req, res) => {
  try {
    const tx = req.body.transaction_uuid;
    if (!tx) return res.json({ ok: true });
    await EsewaPayment.updateOne(
      { transactionUuid: tx, status: 'PENDING' },
      { $set: { status: 'FAILED' } }
    );
    res.json({ ok: true });
  } catch (error) {
    res.json({ ok: true });
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

        const payment = await EsewaPayment.findOne({
          transactionUuid: paymentSessionId,
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

      void sendEventRegistrationEmail({
        to: email,
        userName: name || req.user?.name || 'Participant',
        eventName: event.title,
        eventDate: event.date,
        eventLocation: event.location,
        participationType,
        paymentConfirmed: participationType === 'ATTENDEE' && Boolean(event.isPaid),
        paymentReference: paymentSessionId,
      });

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
// @desc    Start payment for paid attendee events (eSewa ePay V2)
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

      const { gatewayUrl, productCode, secretKey } = getEsewaConfig();
      const frontendBase = process.env.FRONTEND_URL || 'http://localhost:3000';
      const transactionUuid = `MNB-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
      const totalAmount = Number(event.price);

      await EsewaPayment.create({
        transactionUuid,
        event: event._id,
        user: userId || undefined,
        name: resolvedName,
        email: resolvedEmail,
        phone: resolvedPhone,
        participationType: 'ATTENDEE',
        totalAmount,
        productCode,
        status: 'PENDING',
      });

      const signature = buildEsewaSignature({
        totalAmount,
        transactionUuid,
        productCode,
        secretKey,
      });

      res.json({
        paymentRequired: true,
        gatewayUrl,
        paymentSessionId: transactionUuid,
        formData: {
          amount: String(totalAmount),
          tax_amount: '0',
          total_amount: String(totalAmount),
          transaction_uuid: transactionUuid,
          product_code: productCode,
          product_service_charge: '0',
          product_delivery_charge: '0',
          success_url: `${frontendBase}/events/public/payment-success`,
          failure_url: `${frontendBase}/events/public/payment-failure`,
          signed_field_names: 'total_amount,transaction_uuid,product_code',
          signature,
        },
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

