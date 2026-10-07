const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Engagement = require('../models/Engagement');
const { protect } = require('../middleware/auth');
const { isEngagementParticipant } = require('../utils/engagementAccess');

// GET /api/messages/unread/count
router.get('/unread/count', protect, async (req, res) => {
  try {
    const engagements = await Engagement.find({
      $or: [
        { client: req.user._id },
        { trainer: req.user._id },
        { nutritionist: req.user._id }
      ]
    });
    const engagementIds = engagements.map(e => e._id);
    const unreadCount = await Message.countDocuments({
      engagement: { $in: engagementIds },
      readBy: { $ne: req.user._id }
    });
    res.json({ unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/messages/:engagementId
router.get('/:engagementId', protect, async (req, res) => {
  try {
    if (!(await isEngagementParticipant(req.params.engagementId, req.user._id))) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const { page = 1, limit = 50 } = req.query;
    const messages = await Message.find({ engagement: req.params.engagementId })
      .populate('sender', 'name avatar role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    await Message.updateMany(
      {
        engagement: req.params.engagementId,
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id },
      },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json({ messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
