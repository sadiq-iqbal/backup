const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ProfessionalProfile = require('../models/ProfessionalProfile');
const Engagement = require('../models/Engagement');
const Post = require('../models/Post');
const Payment = require('../models/Payment');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require admin role
router.use(protect, authorize('admin'));

// GET /api/admin/dashboard
router.get('/dashboard', async (_req, res) => {
  try {
    const [totalUsers, totalEngagements, totalPosts, pendingVerifications, heldPayments] = await Promise.all([
      User.countDocuments(),
      Engagement.countDocuments(),
      Post.countDocuments(),
      ProfessionalProfile.countDocuments({ verificationStatus: 'pending' }),
      Payment.aggregate([{ $match: { status: 'held' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);
    res.json({ totalUsers, totalEngagements, totalPosts, pendingVerifications, heldPaymentsTotal: heldPayments[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/verifications — pending professional verifications
router.get('/verifications', async (_req, res) => {
  try {
    const profiles = await ProfessionalProfile.find({ verificationStatus: 'pending' })
      .populate('user', 'name email role avatar createdAt')
      .sort({ createdAt: 1 });
    res.json({ profiles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/verifications/:profileId
router.put('/verifications/:profileId', async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const profile = await ProfessionalProfile.findByIdAndUpdate(req.params.profileId, { verificationStatus: status, verificationNote: note }, { new: true }).populate('user', 'name email');
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    // Update user's isVerified flag
    await User.findByIdAndUpdate(profile.user._id, { isVerified: status === 'approved' });
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    const total = await User.countDocuments(filter);
    res.json({ users, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/users/:id/deactivate
router.put('/users/:id/deactivate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/engagements
router.get('/engagements', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const engagements = await Engagement.find(filter)
      .populate('client', 'name email')
      .populate('trainer', 'name email')
      .populate('nutritionist', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ engagements });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/payments
router.get('/payments', async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('payer', 'name email')
      .populate('payee', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
