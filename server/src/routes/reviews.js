const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const ProfessionalProfile = require('../models/ProfessionalProfile');
const Engagement = require('../models/Engagement');
const { protect, authorize } = require('../middleware/auth');

// POST /api/reviews — client leaves a review
router.post('/', protect, authorize('client'), async (req, res) => {
  try {
    const { engagementId, revieweeId, rating, comment } = req.body;
    const eng = await Engagement.findOne({ _id: engagementId, client: req.user._id });
    if (!eng) return res.status(403).json({ error: 'Not authorized' });

    const existing = await Review.findOne({ engagement: engagementId, reviewer: req.user._id, reviewee: revieweeId });
    if (existing) return res.status(400).json({ error: 'You already reviewed this professional' });

    const review = await Review.create({ engagement: engagementId, reviewer: req.user._id, reviewee: revieweeId, rating, comment });

    // Update professional's avg rating
    const allReviews = await Review.find({ reviewee: revieweeId });
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await ProfessionalProfile.findOneAndUpdate({ user: revieweeId }, { avgRating: parseFloat(avg.toFixed(1)), totalReviews: allReviews.length });

    res.status(201).json({ review });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reviews/professional/:userId
router.get('/professional/:userId', async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate('reviewer', 'name avatar')
      .sort({ createdAt: -1 });
    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/reviews/:id/reply — professional replies to a review
router.put('/:id/reply', protect, authorize('trainer', 'nutritionist'), async (req, res) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, reviewee: req.user._id });
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (review.professionalReply) return res.status(400).json({ error: 'Already replied' });
    review.professionalReply = req.body.reply;
    await review.save();
    res.json({ review });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
