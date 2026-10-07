const express = require('express');
const router = express.Router();
const ProgressEntry = require('../models/ProgressEntry');
const Engagement = require('../models/Engagement');
const { protect, authorize } = require('../middleware/auth');
const { createNotification } = require('../utils/notify');

const isParticipant = async (engagementId, userId) => {
  const eng = await Engagement.findById(engagementId);
  if (!eng) return null;
  const ids = [eng.client, eng.trainer, eng.nutritionist].filter(Boolean).map(String);
  return ids.includes(String(userId)) ? eng : null;
};

// GET /api/progress/:engagementId
router.get('/:engagementId', protect, async (req, res) => {
  try {
    const eng = await isParticipant(req.params.engagementId, req.user._id);
    if (!eng) return res.status(403).json({ error: 'Not authorized' });
    const entries = await ProgressEntry.find({ engagement: req.params.engagementId }).sort({ loggedAt: 1 });
    res.json({ entries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/progress — client logs progress
router.post('/', protect, authorize('client'), async (req, res) => {
  try {
    const { engagementId, weightKg, measurements, energyLevel, sleepQuality, mood, notes } = req.body;
    const eng = await Engagement.findOne({ _id: engagementId, client: req.user._id });
    if (!eng) return res.status(403).json({ error: 'Not authorized' });

    const entry = await ProgressEntry.create({ engagement: engagementId, client: req.user._id, weightKg, measurements, energyLevel, sleepQuality, mood, notes });

    const notify = [];
    if (eng.trainer) notify.push(createNotification(eng.trainer, 'progress_logged', 'Your client logged a progress update', `/engagements/${engagementId}`));
    if (eng.nutritionist) notify.push(createNotification(eng.nutritionist, 'progress_logged', 'Your client logged a progress update', `/engagements/${engagementId}`));
    await Promise.all(notify);

    res.status(201).json({ entry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/progress/:id/annotate — professional adds annotation
router.post('/:id/annotate', protect, authorize('trainer', 'nutritionist'), async (req, res) => {
  try {
    const entry = await ProgressEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    const eng = await isParticipant(entry.engagement, req.user._id);
    if (!eng) return res.status(403).json({ error: 'Not authorized' });

    entry.professionalAnnotations.push({ author: req.user._id, note: req.body.note });
    await entry.save();
    res.json({ entry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
