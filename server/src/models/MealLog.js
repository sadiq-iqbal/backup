const mongoose = require('mongoose');

const mealLogSchema = new mongoose.Schema(
  {
    engagement: { type: mongoose.Schema.Types.ObjectId, ref: 'Engagement', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mealPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'MealPlan', required: true },
    mealId: { type: mongoose.Schema.Types.ObjectId, required: true },
    loggedAt: { type: Date, default: Date.now },
    compliance: { type: String, enum: ['full', 'partial', 'skipped'], required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MealLog', mealLogSchema);
