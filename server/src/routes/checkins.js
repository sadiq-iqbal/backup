const express = require('express');
const router = express.Router();
const CheckIn = require('../models/CheckIn');
const Engagement = require('../models/Engagement');
const { protect, authorize } = require('../middleware/auth');
const { createNotification } = require('../utils/notify');

// GET /api/checkins/:engagementId
router.get('/:engagementId', protect, async (req, res) => {
  try {
    const eng = await Engagement.findById(req.params.engagementId);
    if (!eng) return res.status(404).json({ error: 'Engagement not found' });
    const ids = [eng.client, eng.trainer, eng.nutritionist].filter(Boolean).map(String);
    if (!ids.includes(String(req.user._id)) && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });

    const checkins = await CheckIn.find({ engagement: req.params.engagementId }).sort({ weekNumber: 1 });
    res.json({ checkins });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/checkins — create weekly check-in slot (trainer or nutritionist)
router.post('/', protect, authorize('trainer', 'nutritionist'), async (req, res) => {
  try {
    const { engagementId, weekNumber } = req.body;
    const eng = await Engagement.findOne({
      _id: engagementId,
      $or: [{ trainer: req.user._id }, { nutritionist: req.user._id }],
    });
    if (!eng) return res.status(403).json({ error: 'Not authorized' });

    const existing = await CheckIn.findOne({ engagement: engagementId, weekNumber });
    if (existing) return res.status(400).json({ error: 'Check-in for this week already exists' });

    const checkin = await CheckIn.create({ engagement: engagementId, client: eng.client, weekNumber, status: 'pending' });
    await createNotification(eng.client, 'checkin_due', `Your week ${weekNumber} check-in is ready to fill out`, `/engagements/${engagementId}`);
    res.status(201).json({ checkin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/checkins/:id/submit — client submits check-in
router.put('/:id/submit', protect, authorize('client'), async (req, res) => {
  try {
    const checkin = await CheckIn.findOne({ _id: req.params.id, client: req.user._id });
    if (!checkin) return res.status(404).json({ error: 'Check-in not found' });

    checkin.responses = req.body.responses;
    checkin.submittedAt = new Date();
    checkin.status = 'submitted';
    await checkin.save();

    const eng = await Engagement.findById(checkin.engagement);
    const notifyIds = [eng?.trainer, eng?.nutritionist].filter(Boolean);
    await Promise.all(notifyIds.map((id) => createNotification(id, 'checkin_submitted', `Your client submitted their week ${checkin.weekNumber} check-in`, `/engagements/${checkin.engagement}`)));

    res.json({ checkin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/checkins/:id/feedback — professional adds feedback
router.put('/:id/feedback', protect, authorize('trainer', 'nutritionist'), async (req, res) => {
  try {
    const checkin = await CheckIn.findById(req.params.id);
    if (!checkin) return res.status(404).json({ error: 'Check-in not found' });

    const eng = await Engagement.findById(checkin.engagement);
    const isTrainer = eng?.trainer?.toString() === req.user._id.toString();
    const isNutritionist = eng?.nutritionist?.toString() === req.user._id.toString();
    if (!isTrainer && !isNutritionist) return res.status(403).json({ error: 'Not authorized' });

    if (isTrainer) { checkin.trainerFeedback = req.body.feedback; checkin.trainerFeedbackAt = new Date(); }
    if (isNutritionist) { checkin.nutritionistFeedback = req.body.feedback; checkin.nutritionistFeedbackAt = new Date(); }
    checkin.status = 'reviewed';
    await checkin.save();

    res.json({ checkin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
