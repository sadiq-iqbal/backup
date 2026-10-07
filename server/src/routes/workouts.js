const express = require('express');
const router = express.Router();
const WorkoutPlan = require('../models/WorkoutPlan');
const WorkoutLog = require('../models/WorkoutLog');
const Engagement = require('../models/Engagement');
const { protect, authorize } = require('../middleware/auth');
const { createNotification } = require('../utils/notify');
const mongoose = require('mongoose');

const isEngagementParticipant = async (engagementId, userId) => {
  const eng = await Engagement.findById(engagementId);
  if (!eng) return null;
  const ids = [eng.client, eng.trainer, eng.nutritionist].filter(Boolean).map(String);
  return ids.includes(String(userId)) ? eng : null;
};

// GET /api/workouts/engagement/:engagementId
router.get('/engagement/:engagementId', protect, async (req, res) => {
  try {
    const eng = await isEngagementParticipant(req.params.engagementId, req.user._id);
    if (!eng) return res.status(403).json({ error: 'Not authorized' });
    const plans = await WorkoutPlan.find({ engagement: req.params.engagementId }).sort({ weekNumber: 1 });
    res.json({ plans });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/workouts — create a workout plan (trainer only)
router.post('/', protect, authorize('trainer'), async (req, res) => {
  try {
    const { engagementId, weekNumber, title, difficultyLevel, days, notes } = req.body;
    const eng = await Engagement.findOne({ _id: engagementId, trainer: req.user._id });
    if (!eng) return res.status(403).json({ error: 'Not authorized' });
    if (eng.status !== 'active') return res.status(409).json({ error: 'Plans can only be added to an active engagement' });
    if (!Number.isInteger(Number(weekNumber)) || Number(weekNumber) < 1) return res.status(400).json({ error: 'Week number must be a positive whole number' });
    const existingWeek = await WorkoutPlan.exists({ engagement: engagementId, weekNumber: Number(weekNumber) });
    if (existingWeek) return res.status(409).json({ error: `A workout plan already exists for week ${weekNumber}` });

    const plan = await WorkoutPlan.create({ engagement: engagementId, trainer: req.user._id, weekNumber, title, difficultyLevel, days, notes });
    await createNotification(eng.client, 'workout_assigned', `Your trainer assigned a new workout plan for week ${weekNumber}`, `/engagements/${engagementId}`);
    res.status(201).json({ plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/workouts/:id — update plan
router.put('/:id', protect, authorize('trainer'), async (req, res) => {
  try {
    const existingPlan = await WorkoutPlan.findOne({ _id: req.params.id, trainer: req.user._id });
    if (!existingPlan) return res.status(404).json({ error: 'Plan not found' });
    const { weekNumber, title, difficultyLevel, days, notes } = req.body;
    if (weekNumber && Number(weekNumber) !== existingPlan.weekNumber) {
      const duplicateWeek = await WorkoutPlan.exists({ engagement: existingPlan.engagement, weekNumber: Number(weekNumber), _id: { $ne: existingPlan._id } });
      if (duplicateWeek) return res.status(409).json({ error: `A workout plan already exists for week ${weekNumber}` });
    }
    const plan = await WorkoutPlan.findByIdAndUpdate(
      existingPlan._id,
      { weekNumber, title, difficultyLevel, days, notes },
      { new: true, runValidators: true }
    );
    res.json({ plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/workouts/:id — delete plan
router.delete('/:id', protect, authorize('trainer'), async (req, res) => {
  try {
    const plan = await WorkoutPlan.findOneAndDelete({ _id: req.params.id, trainer: req.user._id });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    // Optional: Delete associated WorkoutLogs
    await WorkoutLog.deleteMany({ workoutPlan: req.params.id });
    res.json({ message: 'Plan deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/workouts/log — client logs a workout
router.post('/log', protect, authorize('client'), async (req, res) => {
  try {
    const { engagementId, workoutPlanId, dayId, notes, rating, skipped } = req.body;
    const eng = await Engagement.findOne({ _id: engagementId, client: req.user._id });
    if (!eng) return res.status(403).json({ error: 'Not authorized' });
    if (eng.status !== 'active') return res.status(409).json({ error: 'Workouts can only be logged for an active engagement' });
    if (!mongoose.Types.ObjectId.isValid(workoutPlanId) || !mongoose.Types.ObjectId.isValid(dayId)) return res.status(400).json({ error: 'Invalid workout selection' });
    const plan = await WorkoutPlan.findOne({ _id: workoutPlanId, engagement: engagementId });
    if (!plan || !plan.days.id(dayId) || plan.days.id(dayId).isRestDay) return res.status(400).json({ error: 'This workout day does not belong to the selected plan' });

    const existingLog = await WorkoutLog.findOne({ engagement: engagementId, client: req.user._id, workoutPlan: workoutPlanId, dayId });
    const log = await WorkoutLog.findOneAndUpdate(
      { engagement: engagementId, client: req.user._id, workoutPlan: workoutPlanId, dayId },
      { notes, rating, skipped: Boolean(skipped), completedAt: new Date() },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    if (eng.trainer && !existingLog) {
      await createNotification(eng.trainer, 'progress_logged', 'Your client logged a workout', `/engagements/${engagementId}`);
    }
    res.status(201).json({ log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workouts/logs/:engagementId
router.get('/logs/:engagementId', protect, async (req, res) => {
  try {
    const eng = await isEngagementParticipant(req.params.engagementId, req.user._id);
    if (!eng) return res.status(403).json({ error: 'Not authorized' });
    const logs = await WorkoutLog.find({ engagement: req.params.engagementId }).sort({ completedAt: -1 });
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
