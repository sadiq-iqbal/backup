const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema(
  {
    engagement: { type: mongoose.Schema.Types.ObjectId, ref: 'Engagement', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    weekNumber: { type: Number, required: true },
    responses: {
      wentWell: { type: String },
      wasHard: { type: String },
      painOrDiscomfort: { type: String },
      questions: { type: String },
    },
    submittedAt: { type: Date },
    trainerFeedback: { type: String },
    trainerFeedbackAt: { type: Date },
    nutritionistFeedback: { type: String },
    nutritionistFeedbackAt: { type: Date },
    status: { type: String, enum: ['pending', 'submitted', 'reviewed'], default: 'pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CheckIn', checkInSchema);
