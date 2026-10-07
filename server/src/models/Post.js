const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    tags: [{ type: String }],
    needsTrainer: { type: Boolean, default: true },
    needsNutritionist: { type: Boolean, default: false },
    budgetMin: { type: Number, required: true },
    budgetMax: { type: Number, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['male', 'female', 'non-binary', 'prefer-not-to-say'], required: true },
    heightCm: { type: Number, required: true },
    weightKg: { type: Number, required: true },
    durationWeeks: { type: Number, required: true },
    trainingLocation: { type: String, enum: ['home', 'gym', 'any'], default: 'any' },
    equipmentAvailable: { type: String, default: '' },
    deadline: { type: Date },
    visibility: { type: String, enum: ['public', 'invite-only'], default: 'public' },
    invitedProfessionals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['open', 'in_progress', 'completed', 'closed'], default: 'open' },
    bidCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

postSchema.index({ status: 1, tags: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
