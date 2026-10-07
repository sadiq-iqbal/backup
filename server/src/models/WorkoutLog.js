const mongoose = require('mongoose');

const workoutLogSchema = new mongoose.Schema(
  {
    engagement: { type: mongoose.Schema.Types.ObjectId, ref: 'Engagement', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workoutPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutPlan', required: true },
    dayId: { type: mongoose.Schema.Types.ObjectId, required: true },
    completedAt: { type: Date, default: Date.now },
    notes: { type: String },
    rating: { type: Number, min: 1, max: 5 },
    skipped: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WorkoutLog', workoutLogSchema);
