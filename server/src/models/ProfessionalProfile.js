const mongoose = require('mongoose');

const professionalProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    specialty: [{ type: String }],
    bio: { type: String, default: '' },
    yearsExperience: { type: Number, default: 0 },
    certifications: [
      {
        name: { type: String },
        issuedBy: { type: String },
        year: { type: Number },
        documentUrl: { type: String },
      },
    ],
    governmentIdUrl: { type: String },
    introVideoUrl: { type: String },
    verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    verificationNote: { type: String },
    avgRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    totalEngagements: { type: Number, default: 0 },
    responseRate: { type: Number, default: 0 },
    hourlyRate: { type: Number, default: 0 },
    availabilityStatus: { type: String, enum: ['open', 'booked'], default: 'open' },
    languages: [{ type: String }],
    location: { type: String },
    totalEarnings: { type: Number, default: 0 },
    pendingEarnings: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProfessionalProfile', professionalProfileSchema);
