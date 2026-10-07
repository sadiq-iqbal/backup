const mongoose = require('mongoose');

const clientProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female', 'non-binary', 'prefer-not-to-say'] },
    heightCm: { type: Number },
    weightKg: { type: Number },
    healthConditions: [{ type: String }],
    fitnessGoals: [{ type: String, enum: ['weight-loss', 'muscle-gain', 'endurance', 'rehab', 'nutrition-only', 'sports-performance', 'general-health'] }],
    activityLevel: { type: String, enum: ['sedentary', 'lightly-active', 'moderately-active', 'very-active'] },
    budgetMin: { type: Number, default: 0 },
    budgetMax: { type: Number, default: 0 },
    preferredDuration: { type: String, enum: ['1-month', '3-months', '6-months', 'custom'], default: '1-month' },
    bio: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

clientProfileSchema.virtual('bmi').get(function () {
  if (!this.heightCm || !this.weightKg) return null;
  const heightM = this.heightCm / 100;
  return parseFloat((this.weightKg / (heightM * heightM)).toFixed(1));
});

clientProfileSchema.virtual('bmiCategory').get(function () {
  const bmi = this.bmi;
  if (!bmi) return null;
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
});

module.exports = mongoose.model('ClientProfile', clientProfileSchema);
