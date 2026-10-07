const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ClientProfile = require('../models/ClientProfile');
const ProfessionalProfile = require('../models/ProfessionalProfile');
const { protect } = require('../middleware/auth');

// GET /api/profiles/me
router.get('/me', protect, async (req, res) => {
  try {
    let profile;
    if (req.user.role === 'client') {
      profile = await ClientProfile.findOne({ user: req.user._id });
    } else if (['trainer', 'nutritionist'].includes(req.user.role)) {
      profile = await ProfessionalProfile.findOne({ user: req.user._id });
    }
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/profiles/me
router.put('/me', protect, async (req, res) => {
  try {
    let profile;
    const updates = { ...req.body };
    delete updates._id;
    delete updates.user;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.__v;

    const opts = { new: true, runValidators: true, upsert: true };
    if (req.user.role === 'client') {
      profile = await ClientProfile.findOneAndUpdate({ user: req.user._id }, updates, opts);
    } else if (['trainer', 'nutritionist'].includes(req.user.role)) {
      profile = await ProfessionalProfile.findOneAndUpdate({ user: req.user._id }, updates, opts);
    }
    // Also update user's name/avatar if provided
    const userUpdates = {};
    if (req.body.name) userUpdates.name = req.body.name;
    if (req.body.avatar) userUpdates.avatar = req.body.avatar;
    if (Object.keys(userUpdates).length) await User.findByIdAndUpdate(req.user._id, userUpdates);

    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/profiles/:userId — public profile
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password -googleId -notificationPreferences');
    if (!user) return res.status(404).json({ error: 'User not found' });

    let profile = null;
    if (user.role === 'client') {
      profile = await ClientProfile.findOne({ user: user._id }).select('fitnessGoals activityLevel bio');
    } else if (['trainer', 'nutritionist'].includes(user.role)) {
      profile = await ProfessionalProfile.findOne({ user: user._id });
    }

    res.json({ user, profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
