const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const Post = require('../models/Post');
const Bid = require('../models/Bid');
const Engagement = require('../models/Engagement');
const { protect, authorize } = require('../middleware/auth');
const { createNotification } = require('../utils/notify');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// GET /api/posts — browse open posts (professionals)
router.get('/', protect, async (req, res) => {
  try {
    const { tags, budgetMin, budgetMax, needsTrainer, needsNutritionist, includeBidded, page = 1, limit = 20 } = req.query;
    const filter = { status: { $in: ['open', 'in_progress'] }, visibility: 'public' };
    if (tags) filter.tags = { $in: tags.split(',') };
    if (budgetMin) filter.budgetMax = { $gte: Number(budgetMin) };
    if (budgetMax) filter.budgetMin = { $lte: Number(budgetMax) };
    if (needsTrainer === 'true') filter.needsTrainer = true;
    if (needsNutritionist === 'true') filter.needsNutritionist = true;

    // In Browse Requests, show professionals only work that still needs their
    // role. A trainer being hired must not hide the same request from a needed
    // nutritionist (and vice versa).
    if (includeBidded !== 'true' && (req.user.role === 'trainer' || req.user.role === 'nutritionist')) {
      const roleField = req.user.role === 'trainer' ? 'needsTrainer' : 'needsNutritionist';
      filter[roleField] = true;

      const [myBids, filledEngagements] = await Promise.all([
        Bid.find({ professional: req.user._id }).select('post'),
        Engagement.find({
          [req.user.role]: { $exists: true, $ne: null },
          status: 'active',
        }).select('post'),
      ]);
      const excludedPostIds = [
        ...myBids.map((bid) => bid.post),
        ...filledEngagements.map((engagement) => engagement.post),
      ];
      if (excludedPostIds.length > 0) {
        filter._id = { $nin: excludedPostIds };
      }
    }

    const posts = await Post.find(filter)
      .populate('client', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Post.countDocuments(filter);
    res.json({ posts, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/posts/my — client's own posts
router.get('/my', protect, authorize('client'), async (req, res) => {
  try {
    const posts = await Post.find({ client: req.user._id }).sort({ createdAt: -1 });
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/posts/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('client', 'name avatar createdAt').lean();
    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (req.user.role === 'trainer' || req.user.role === 'nutritionist') {
      const bid = await Bid.findOne({ post: req.params.id, professional: req.user._id });
      post.hasBidded = !!bid;
    }

    res.json({ post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/posts — create post (client only)
router.post(
  '/',
  protect,
  authorize('client'),
  [
    body('title').notEmpty().trim(),
    body('description').notEmpty(),
    body('budgetMin').isNumeric(),
    body('budgetMax').isNumeric(),
    body('age').isNumeric(),
    body('gender').isIn(['male', 'female', 'non-binary', 'prefer-not-to-say']),
    body('heightCm').isNumeric(),
    body('weightKg').isNumeric(),
    body('durationWeeks').isNumeric(),
    body('trainingLocation').optional().isIn(['home', 'gym', 'any']),
    body('equipmentAvailable').optional().isString(),
  ],
  validate,
  async (req, res) => {
    try {
      const post = await Post.create({ ...req.body, client: req.user._id });
      res.status(201).json({ post });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// PUT /api/posts/:id — update post (owner only)
router.put('/:id', protect, authorize('client'), async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, client: req.user._id });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.status !== 'open') return res.status(400).json({ error: 'Cannot edit a non-open post' });
    Object.assign(post, req.body);
    await post.save();
    res.json({ post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/posts/:id
router.delete('/:id', protect, authorize('client'), async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({ _id: req.params.id, client: req.user._id });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/posts/:id/bids — get bids on a post
router.get('/:id/bids', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Only client owner or admin can see all bids
    const isOwner = post.client.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Not authorized' });

    const bids = await Bid.find({ post: req.params.id })
      .populate('professional', 'name avatar role isVerified')
      .sort({ createdAt: -1 });
    res.json({ bids });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
