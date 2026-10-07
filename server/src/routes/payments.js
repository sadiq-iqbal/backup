const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Engagement = require('../models/Engagement');
const { protect, authorize } = require('../middleware/auth');
const { createNotification } = require('../utils/notify');

// GET /api/payments/engagement/:engagementId
router.get('/engagement/:engagementId', protect, async (req, res) => {
  try {
    const eng = await Engagement.findById(req.params.engagementId);
    if (!eng) return res.status(404).json({ error: 'Not found' });
    const ids = [eng.client, eng.trainer, eng.nutritionist].filter(Boolean).map(String);
    if (!ids.includes(String(req.user._id)) && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });
    const payments = await Payment.find({ engagement: req.params.engagementId }).sort({ createdAt: -1 });
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/:id/release — admin releases payment
router.post('/:id/release', protect, authorize('admin'), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('engagement');
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    payment.status = 'released';
    await payment.save();
    await createNotification(payment.payee, 'payment_released', `Payment of $${payment.netAmount} has been released`, '/dashboard');
    res.json({ payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/:id/refund — admin refunds
router.post('/:id/refund', protect, authorize('admin'), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    payment.status = 'refunded';
    await payment.save();
    res.json({ payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
