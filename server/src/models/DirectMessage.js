const mongoose = require('mongoose');

const directMessageSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// Index for fast thread lookup
directMessageSchema.index({ post: 1, sender: 1, receiver: 1, createdAt: -1 });

module.exports = mongoose.model('DirectMessage', directMessageSchema);
