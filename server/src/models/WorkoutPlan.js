const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sets: { type: Number },
  reps: { type: String },
  restSeconds: { type: Number },
  videoUrl: { type: String },
  notes: { type: String },
  order: { type: Number, default: 0 },
  exerciseDbId: { type: String },
  gifUrl: { type: String },
  target: { type: String },
  bodyPart: { type: String },
  equipment: { type: String },
  secondaryMuscles: [{ type: String }],
  instructions: [{ type: String }],
});

const workoutDaySchema = new mongoose.Schema({
  dayOfWeek: { type: String, enum: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'], required: true },
  focusArea: { type: String },
  durationMinutes: { type: Number },
  notes: { type: String },
  isRestDay: { type: Boolean, default: false },
  exercises: [exerciseSchema],
});

const workoutPlanSchema = new mongoose.Schema(
  {
    engagement: { type: mongoose.Schema.Types.ObjectId, ref: 'Engagement', required: true },
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    weekNumber: { type: Number, required: true },
    title: { type: String, default: '' },
    difficultyLevel: { type: String, enum: ['beginner','intermediate','advanced'], default: 'beginner' },
    days: [workoutDaySchema],
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);
