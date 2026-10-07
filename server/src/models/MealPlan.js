const mongoose = require('mongoose');

const mealItemSchema = new mongoose.Schema({
  name: { type: String },
  portionSize: { type: String },
  calories: { type: Number },
  notes: { type: String },
});

const mealSchema = new mongoose.Schema({
  dayOfWeek: { type: String, enum: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'], required: true },
  mealType: { type: String, enum: ['breakfast','lunch','dinner','snack'], required: true },
  items: [mealItemSchema],
  totalCalories: { type: Number, default: 0 },
  notes: { type: String },
});

const mealPlanSchema = new mongoose.Schema(
  {
    engagement: { type: mongoose.Schema.Types.ObjectId, ref: 'Engagement', required: true },
    nutritionist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    weekNumber: { type: Number, required: true },
    dailyCalories: { type: Number },
    proteinG: { type: Number },
    carbsG: { type: Number },
    fatsG: { type: Number },
    fiberG: { type: Number },
    allergyFlags: [{ type: String }],
    meals: [mealSchema],
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MealPlan', mealPlanSchema);
