const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    professional: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    proposal: { type: String, required: true },
    price: { type: Number, required: true },
    estimatedWeeks: { type: Number, required: true },
    introOffer: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'shortlisted'], default: 'pending' },
  },
  { timestamps: true }
);

bidSchema.index({ post: 1, professional: 1 }, { unique: true });

module.exports = mongoose.model('Bid', bidSchema);
