const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Bid = require('../models/Bid');
const Post = require('../models/Post');
const Engagement = require('../models/Engagement');
const Payment = require('../models/Payment');
const Message = require('../models/Message');
const User = require('../models/User');
const ProfessionalProfile = require('../models/ProfessionalProfile');
const { protect, authorize } = require('../middleware/auth');
const { createNotification } = require('../utils/notify');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// POST /api/bids — submit a bid
router.post(
  '/',
  protect,
  authorize('trainer', 'nutritionist'),
  [
    body('post').notEmpty(),
    body('proposal').notEmpty(),
    body('price').isNumeric(),
    body('estimatedWeeks').isNumeric(),
  ],
  validate,
  async (req, res) => {
    try {
      const { post: postId, proposal, price, estimatedWeeks, introOffer } = req.body;

      // Allow unverified professionals to place bids
      const profile = await ProfessionalProfile.findOne({ user: req.user._id });
      if (!profile) {
        return res.status(403).json({ error: 'Professional profile not found' });
      }

      const post = await Post.findById(postId);
      if (!post) return res.status(404).json({ error: 'Post not found' });
      if (post.status !== 'open' && post.status !== 'in_progress') {
        return res.status(404).json({ error: 'Post not open for bidding' });
      }

      // If in progress, check if the role is already fulfilled
      if (post.status === 'in_progress') {
        const engagement = await Engagement.findOne({ post: postId, client: post.client });
        if (engagement && engagement[req.user.role]) {
          return res.status(400).json({ error: `A ${req.user.role} has already been hired for this request.` });
        }
      }

      // Enforce budget ceiling
      if (price > post.budgetMax) {
        return res.status(400).json({ error: `Price cannot exceed client's maximum budget of $${post.budgetMax}` });
      }

      // Check duplicate
      const existing = await Bid.findOne({ post: postId, professional: req.user._id });
      if (existing) return res.status(400).json({ error: 'You have already submitted a bid on this post' });

      const bid = await Bid.create({ post: postId, professional: req.user._id, proposal, price, estimatedWeeks, introOffer });
      await Post.findByIdAndUpdate(postId, { $inc: { bidCount: 1 } });

      // Notify client
      await createNotification(post.client, 'new_bid', `You received a new bid on your post "${post.title}"`, `/posts/${postId}`);

      res.status(201).json({ bid });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// GET /api/bids/my — professional's own bids
router.get('/my', protect, authorize('trainer', 'nutritionist'), async (req, res) => {
  try {
    const bids = await Bid.find({ professional: req.user._id })
      .populate('post', 'title status budgetMin budgetMax client')
      .sort({ createdAt: -1 });
    res.json({ bids });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bids/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id)
      .populate('professional', 'name avatar role isVerified')
      .populate('post', 'title client');
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    res.json({ bid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/bids/:id/shortlist
router.put('/:id/shortlist', protect, authorize('client'), async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id).populate('post');
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    if (bid.post.client.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Not authorized' });
    bid.status = 'shortlisted';
    await bid.save();
    res.json({ bid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/bids/:id/accept — accept a bid & create engagement
router.put('/:id/accept', protect, authorize('client'), async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id).populate('post professional');
    if (!bid) return res.status(404).json({ error: 'Bid not found' });

    const post = bid.post;
    if (post.client.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Not authorized' });
    if (!['pending', 'shortlisted'].includes(bid.status)) {
      return res.status(400).json({ error: `This bid is already ${bid.status}` });
    }

    // Find or create engagement
    let engagement = await Engagement.findOne({ post: post._id, client: req.user._id });

    const professionalRole = bid.professional.role;
    const existingTeammateId = engagement
      ? (professionalRole === 'trainer' ? engagement.nutritionist : engagement.trainer)
      : null;
    if (!['trainer', 'nutritionist'].includes(professionalRole)) {
      return res.status(400).json({ error: 'Invalid professional role' });
    }
    const roleIsRequired = professionalRole === 'trainer' ? post.needsTrainer : post.needsNutritionist;
    if (!roleIsRequired) {
      return res.status(400).json({ error: `This request does not need a ${professionalRole}` });
    }
    if (engagement?.[professionalRole]) {
      return res.status(400).json({ error: `A ${professionalRole} has already been assigned to this request` });
    }

    bid.status = 'accepted';
    await bid.save();

    if (!engagement) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (post.durationWeeks || 4) * 7);
      engagement = await Engagement.create({
        post: post._id,
        client: req.user._id,
        [professionalRole]: bid.professional._id,
        [`${professionalRole}Bid`]: bid._id,
        endDate,
        durationWeeks: post.durationWeeks,
        totalAmount: bid.price,
        status: 'active',
      });
    } else {
      engagement[professionalRole] = bid.professional._id;
      engagement[`${professionalRole}Bid`] = bid._id;
      engagement.totalAmount = (engagement.totalAmount || 0) + bid.price;
      await engagement.save();
    }

    // A newly added teammate can read the existing context, but historical
    // messages should not appear as a large unread backlog.
    await Message.updateMany(
      { engagement: engagement._id },
      { $addToSet: { readBy: bid.professional._id } }
    );

    // Once a role is filled, close the competing bids for that same role.
    const sameRoleProfessionalIds = await User.find({ role: professionalRole }).distinct('_id');
    const competingBids = await Bid.find({
      post: post._id,
      professional: { $in: sameRoleProfessionalIds },
      _id: { $ne: bid._id },
      status: { $in: ['pending', 'shortlisted'] },
    }).select('professional');
    await Bid.updateMany(
      {
        post: post._id,
        professional: { $in: sameRoleProfessionalIds },
        _id: { $ne: bid._id },
        status: { $in: ['pending', 'shortlisted'] },
      },
      { $set: { status: 'rejected' } }
    );

    await Promise.all(competingBids.map((competingBid) => createNotification(
      competingBid.professional,
      'role_filled',
      `The ${professionalRole} role on "${post.title}" has been filled.`,
      `/posts/${post._id}`
    )));

    // Update post status — only close the post when all ENGAGED roles are filled
    // A post stays in_progress if either:
    //   - it originally needs a role and that role is not yet in the engagement
    //   - it has a needsTrainer/needsNutritionist flag set that isn't fulfilled yet
    const trainerFilled = !post.needsTrainer || !!engagement.trainer;
    const nutritionistFilled = !post.needsNutritionist || !!engagement.nutritionist;
    const allRolesFilled = trainerFilled && nutritionistFilled;
    post.status = allRolesFilled ? 'closed' : 'in_progress';
    await post.save();

    // Create escrow payment record
    await Payment.create({
      engagement: engagement._id,
      payer: req.user._id,
      payee: bid.professional._id,
      amount: bid.price,
      platformFee: Math.round(bid.price * 0.12),
      netAmount: Math.round(bid.price * 0.88),
      type: 'escrow',
    });

    // Notify professional
    await createNotification(bid.professional._id, 'bid_accepted', `Your bid on "${post.title}" was accepted!`, `/engagements/${engagement._id}`);
    if (existingTeammateId) {
      await createNotification(
        existingTeammateId,
        'team_member_added',
        `${bid.professional.name} joined "${post.title}" as the ${professionalRole}.`,
        `/engagements/${engagement._id}`
      );
    }

    res.json({ engagement, bid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/bids/:id/reject
router.put('/:id/reject', protect, authorize('client'), async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id).populate('post');
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    if (bid.post.client.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Not authorized' });
    bid.status = 'rejected';
    await bid.save();
    res.json({ bid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
