const express = require('express');
const router = express.Router();
const MealPlan = require('../models/MealPlan');
const MealLog = require('../models/MealLog');
const Engagement = require('../models/Engagement');
const { protect, authorize } = require('../middleware/auth');
const { createNotification } = require('../utils/notify');
const mongoose = require('mongoose');

const isParticipant = async (engagementId, userId) => {
  const eng = await Engagement.findById(engagementId);
  if (!eng) return null;
  const ids = [eng.client, eng.trainer, eng.nutritionist].filter(Boolean).map(String);
  return ids.includes(String(userId)) ? eng : null;
};

// GET /api/meals/engagement/:engagementId
router.get('/engagement/:engagementId', protect, async (req, res) => {
  try {
    const eng = await isParticipant(req.params.engagementId, req.user._id);
    if (!eng) return res.status(403).json({ error: 'Not authorized' });
    const plans = await MealPlan.find({ engagement: req.params.engagementId }).sort({ weekNumber: 1 });
    res.json({ plans });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/meals — create meal plan (nutritionist only)
router.post('/', protect, authorize('nutritionist'), async (req, res) => {
  try {
    const { engagementId, weekNumber, dailyCalories, proteinG, carbsG, fatsG, fiberG, allergyFlags, meals, notes } = req.body;
    const eng = await Engagement.findOne({ _id: engagementId, nutritionist: req.user._id });
    if (!eng) return res.status(403).json({ error: 'Not authorized' });
    if (eng.status !== 'active') return res.status(409).json({ error: 'Plans can only be added to an active engagement' });
    if (!Number.isInteger(Number(weekNumber)) || Number(weekNumber) < 1) return res.status(400).json({ error: 'Week number must be a positive whole number' });
    const existingWeek = await MealPlan.exists({ engagement: engagementId, weekNumber: Number(weekNumber) });
    if (existingWeek) return res.status(409).json({ error: `A meal plan already exists for week ${weekNumber}` });

    const plan = await MealPlan.create({ engagement: engagementId, nutritionist: req.user._id, weekNumber, dailyCalories, proteinG, carbsG, fatsG, fiberG, allergyFlags, meals, notes });
    await createNotification(eng.client, 'meal_plan_assigned', `Your nutritionist assigned a new meal plan for week ${weekNumber}`, `/engagements/${engagementId}`);
    res.status(201).json({ plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/meals/:id
router.put('/:id', protect, authorize('nutritionist'), async (req, res) => {
  try {
    const existingPlan = await MealPlan.findOne({ _id: req.params.id, nutritionist: req.user._id });
    if (!existingPlan) return res.status(404).json({ error: 'Plan not found' });
    const { weekNumber, dailyCalories, proteinG, carbsG, fatsG, fiberG, allergyFlags, meals, notes } = req.body;
    if (weekNumber && Number(weekNumber) !== existingPlan.weekNumber) {
      const duplicateWeek = await MealPlan.exists({ engagement: existingPlan.engagement, weekNumber: Number(weekNumber), _id: { $ne: existingPlan._id } });
      if (duplicateWeek) return res.status(409).json({ error: `A meal plan already exists for week ${weekNumber}` });
    }
    const plan = await MealPlan.findByIdAndUpdate(
      existingPlan._id,
      { weekNumber, dailyCalories, proteinG, carbsG, fatsG, fiberG, allergyFlags, meals, notes },
      { new: true, runValidators: true }
    );
    
    const eng = await Engagement.findById(plan.engagement);
    if (eng) {
      await createNotification(eng.client, 'meal_plan_assigned', `Your nutritionist updated your meal plan for week ${plan.weekNumber}`, `/engagements/${plan.engagement}`);
    }

    res.json({ plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/meals/log
router.post('/log', protect, authorize('client'), async (req, res) => {
  try {
    const { engagementId, mealPlanId, mealId, compliance, notes } = req.body;
    const eng = await Engagement.findOne({ _id: engagementId, client: req.user._id });
    if (!eng) return res.status(403).json({ error: 'Not authorized' });
    if (eng.status !== 'active') return res.status(409).json({ error: 'Meals can only be logged for an active engagement' });
    if (!mongoose.Types.ObjectId.isValid(mealPlanId) || !mongoose.Types.ObjectId.isValid(mealId)) return res.status(400).json({ error: 'Invalid meal selection' });
    const plan = await MealPlan.findOne({ _id: mealPlanId, engagement: engagementId });
    if (!plan || !plan.meals.id(mealId)) return res.status(400).json({ error: 'This meal does not belong to the selected plan' });

    const existingLog = await MealLog.findOne({ engagement: engagementId, client: req.user._id, mealPlan: mealPlanId, mealId });
    const log = await MealLog.findOneAndUpdate(
      { engagement: engagementId, client: req.user._id, mealPlan: mealPlanId, mealId },
      { compliance, notes, loggedAt: new Date() },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );
    if (eng.nutritionist && !existingLog) {
      await createNotification(eng.nutritionist, 'progress_logged', 'Your client logged a meal', `/engagements/${engagementId}`);
    }
    res.status(201).json({ log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/meals/logs/:engagementId
router.get('/logs/:engagementId', protect, async (req, res) => {
  try {
    const eng = await isParticipant(req.params.engagementId, req.user._id);
    if (!eng) return res.status(403).json({ error: 'Not authorized' });
    const logs = await MealLog.find({ engagement: req.params.engagementId }).sort({ loggedAt: -1 });
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
