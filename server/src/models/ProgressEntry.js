const mongoose = require('mongoose');

const progressEntrySchema = new mongoose.Schema(
  {
    engagement: { type: mongoose.Schema.Types.ObjectId, ref: 'Engagement', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    loggedAt: { type: Date, default: Date.now },
    weightKg: { type: Number },
    measurements: {
      waistCm: Number,
      chestCm: Number,
      hipsCm: Number,
      leftArmCm: Number,
      rightArmCm: Number,
      leftThighCm: Number,
      rightThighCm: Number,
    },
    photoUrls: [{ type: String }],
    energyLevel: { type: Number, min: 1, max: 5 },
    sleepQuality: { type: Number, min: 1, max: 5 },
    mood: { type: Number, min: 1, max: 5 },
    notes: { type: String },
    professionalAnnotations: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProgressEntry', progressEntrySchema);
