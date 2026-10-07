const mongoose = require('mongoose');

const engagementSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    nutritionist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    trainerBid: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid', default: null },
    nutritionistBid: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid', default: null },
    status: { type: String, enum: ['active', 'paused', 'completed', 'disputed'], default: 'active' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    durationWeeks: { type: Number },
    totalAmount: { type: Number, default: 0 },
    escrowStatus: { type: String, enum: ['held', 'released', 'refunded', 'partial'], default: 'held' },
    milestones: [
      {
        label: { type: String },
        dueAt: { type: Date },
        completedAt: { type: Date },
        percentageRelease: { type: Number },
      },
    ],
    reviewRequested: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// A client post owns one shared workspace for the client, trainer, and
// nutritionist. Prevent concurrent bid accepts from creating split teams.
engagementSchema.index({ post: 1 }, { unique: true });

module.exports = mongoose.model('Engagement', engagementSchema);
