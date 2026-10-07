const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    engagement: { type: mongoose.Schema.Types.ObjectId, ref: 'Engagement', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    content: { type: String, trim: true, maxlength: 5000 },
    attachmentUrl: { type: String },
    attachmentType: { type: String, enum: ['image', 'pdf', 'video', 'other'] },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isGroupMessage: { type: Boolean, default: true },
  },
  { timestamps: true }
);

messageSchema.index({ engagement: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
