const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    engagement: { type: mongoose.Schema.Types.ObjectId, ref: 'Engagement', required: true },
    payer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    payee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: { type: Number, required: true },
    platformFee: { type: Number, default: 0 },
    netAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['held', 'released', 'refunded', 'failed'], default: 'held' },
    stripePaymentIntentId: { type: String },
    stripeTransferId: { type: String },
    type: { type: String, enum: ['escrow', 'release', 'refund'], default: 'escrow' },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
