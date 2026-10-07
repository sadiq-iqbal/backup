const express = require('express');
const router = express.Router();
const Engagement = require('../models/Engagement');
const WorkoutPlan = require('../models/WorkoutPlan');
const MealPlan = require('../models/MealPlan');
const WorkoutLog = require('../models/WorkoutLog');
const MealLog = require('../models/MealLog');
const CheckIn = require('../models/CheckIn');
const ProgressEntry = require('../models/ProgressEntry');
const Message = require('../models/Message');
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');

const getCurrentWeek = (engagement) => {
  const start = new Date(engagement.startDate || engagement.createdAt);
  const elapsedMs = Math.max(0, Date.now() - start.getTime());
  const calculatedWeek = Math.floor(elapsedMs / (7 * 24 * 60 * 60 * 1000)) + 1;
  return engagement.durationWeeks ? Math.min(calculatedWeek, engagement.durationWeeks) : calculatedWeek;
};

// GET /api/engagements — list engagements for current user
router.get('/', protect, async (req, res) => {
  try {
    const roleFilter =
      req.user.role === 'client'
        ? { client: req.user._id }
        : req.user.role === 'trainer'
        ? { trainer: req.user._id }
        : req.user.role === 'nutritionist'
        ? { nutritionist: req.user._id }
        : {};

    const engagements = await Engagement.find(roleFilter)
      .populate('client', 'name avatar role')
      .populate('trainer', 'name avatar role')
      .populate('nutritionist', 'name avatar role')
      .populate('post', 'title needsTrainer needsNutritionist')
      .sort({ createdAt: -1 });

    res.json({ engagements });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/engagements/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const engagement = await Engagement.findById(req.params.id)
      .populate('client', 'name avatar role')
      .populate('trainer', 'name avatar role')
      .populate('nutritionist', 'name avatar role')
      .populate('post', 'title description tags needsTrainer needsNutritionist');

    if (!engagement) return res.status(404).json({ error: 'Engagement not found' });

    const isParticipant =
      [engagement.client?._id, engagement.trainer?._id, engagement.nutritionist?._id]
        .filter(Boolean)
        .some((id) => id.toString() === req.user._id.toString()) || req.user.role === 'admin';

    if (!isParticipant) return res.status(403).json({ error: 'Not authorized' });

    // Attach the plan for the actual engagement week. Future plans stay scheduled
    // instead of replacing the current plan in the overview.
    const currentWeek = getCurrentWeek(engagement);
    const [workoutPlan, mealPlan, recentProgress, pendingCheckIn, unreadMessagesCount] = await Promise.all([
      WorkoutPlan.findOne({ engagement: engagement._id, weekNumber: { $lte: currentWeek } }).sort({ weekNumber: -1 }),
      MealPlan.findOne({ engagement: engagement._id, weekNumber: { $lte: currentWeek } }).sort({ weekNumber: -1 }),
      ProgressEntry.find({ engagement: engagement._id }).sort({ loggedAt: -1 }).limit(1),
      CheckIn.findOne({ engagement: engagement._id, status: 'pending', client: engagement.client._id }),
      Message.countDocuments({ engagement: engagement._id, readBy: { $ne: req.user._id } }),
    ]);

    const [workoutLogs, mealLogs] = await Promise.all([
      workoutPlan ? WorkoutLog.find({ engagement: engagement._id, workoutPlan: workoutPlan._id }).sort({ completedAt: -1 }) : [],
      mealPlan ? MealLog.find({ engagement: engagement._id, mealPlan: mealPlan._id }).sort({ loggedAt: -1 }) : [],
    ]);

    const workoutDayIds = new Set((workoutPlan?.days || []).filter((day) => !day.isRestDay).map((day) => String(day._id)));
    const completedWorkoutIds = new Set(
      workoutLogs.filter((log) => !log.skipped && workoutDayIds.has(String(log.dayId))).map((log) => String(log.dayId))
    );
    const mealIds = new Set((mealPlan?.meals || []).map((meal) => String(meal._id)));
    const latestMealLogs = new Map();
    mealLogs.forEach((log) => {
      const mealId = String(log.mealId);
      if (mealIds.has(mealId) && !latestMealLogs.has(mealId)) latestMealLogs.set(mealId, log);
    });
    const adherencePoints = [...latestMealLogs.values()].reduce(
      (total, log) => total + (log.compliance === 'full' ? 1 : log.compliance === 'partial' ? 0.5 : 0),
      0
    );

    const weeklySummary = {
      currentWeek,
      workoutsCompleted: completedWorkoutIds.size,
      workoutsScheduled: workoutDayIds.size,
      mealsLogged: latestMealLogs.size,
      mealsScheduled: mealIds.size,
      mealAdherencePercent: mealIds.size ? Math.round((adherencePoints / mealIds.size) * 100) : null,
    };

    res.json({
      engagement,
      latestWorkoutPlan: workoutPlan || null,
      latestMealPlan: mealPlan || null,
      recentProgress: recentProgress[0] || null,
      pendingCheckIn,
      unreadMessagesCount,
      weeklySummary,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/engagements/:id/status
router.put('/:id/status', protect, async (req, res) => {
  try {
    const engagement = await Engagement.findById(req.params.id);
    if (!engagement) return res.status(404).json({ error: 'Engagement not found' });

    const isParticipant = [engagement.client, engagement.trainer, engagement.nutritionist]
      .filter(Boolean)
      .some((id) => id.toString() === req.user._id.toString());
    if (!isParticipant && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });

    const allowedStatuses = ['active', 'paused', 'completed', 'disputed'];
    if (!allowedStatuses.includes(req.body.status)) {
      return res.status(400).json({ error: 'Invalid engagement status' });
    }

    engagement.status = req.body.status;
    await engagement.save();

    if (engagement.status === 'completed') {
      await Post.findByIdAndUpdate(engagement.post, { status: 'completed' });
    }
    res.json({ engagement });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
