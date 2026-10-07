const express = require('express');
const router = express.Router();
const DirectMessage = require('../models/DirectMessage');
const { protect } = require('../middleware/auth');
const { canAccessPostMessages, canMessageUser } = require('../utils/directMessageAccess');

// POST /api/dm — send a direct message
router.post('/', protect, async (req, res) => {
  try {
    const { postId, receiverId, content } = req.body;
    if (!postId || !receiverId || !content?.trim()) {
      return res.status(400).json({ error: 'postId, receiverId and content are required' });
    }

    if (content.trim().length > 5000) {
      return res.status(400).json({ error: 'Message cannot exceed 5000 characters' });
    }

    if (!(await canMessageUser(postId, req.user, receiverId))) {
      return res.status(403).json({ error: 'Not authorized to message in this post' });
    }

    const dm = await DirectMessage.create({
      post: postId,
      sender: req.user._id,
      receiver: receiverId,
      content: content.trim(),
      readBy: [req.user._id],
    });

    await dm.populate('sender', 'name avatar role');
    await dm.populate('receiver', 'name avatar role');

    // Emit via socket if available
    const io = req.app.get('io');
    if (io) {
      const room = `dm:${postId}:${[req.user._id.toString(), receiverId].sort().join(':')}`;
      io.to(room).emit('new_dm', dm.toObject());
    }

    res.status(201).json({ message: dm });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dm/:postId/:userId — get thread between current user and another user on a post
router.get('/:postId([0-9a-fA-F]{24})/:userId([0-9a-fA-F]{24})', protect, async (req, res) => {
  try {
    const { postId, userId } = req.params;

    if (!(await canMessageUser(postId, req.user, userId))) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const messages = await DirectMessage.find({
      post: postId,
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ],
    })
      .populate('sender', 'name avatar role')
      .populate('receiver', 'name avatar role')
      .sort({ createdAt: 1 });

    // Mark as read
    await DirectMessage.updateMany(
      { post: postId, sender: userId, receiver: req.user._id, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dm/inbox — list all DM threads for current user (latest message per thread)
router.get('/inbox/list', protect, async (req, res) => {
  try {
    // Get all DMs involving this user
    const all = await DirectMessage.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    })
      .populate('sender', 'name avatar role')
      .populate('receiver', 'name avatar role')
      .populate('post', 'title')
      .sort({ createdAt: -1 });

    // Group by post + other user
    const threadMap = new Map();
    for (const dm of all) {
      if (!dm.sender || !dm.receiver || !dm.post) continue;
      const otherId = dm.sender._id.toString() === req.user._id.toString()
        ? dm.receiver._id.toString()
        : dm.sender._id.toString();
      const key = `${dm.post?._id}:${otherId}`;
      if (!threadMap.has(key)) {
        const other = dm.sender._id.toString() === req.user._id.toString() ? dm.receiver : dm.sender;
        threadMap.set(key, {
          postId: dm.post?._id,
          postTitle: dm.post?.title,
          other,
          lastMessage: dm,
          unread: !dm.readBy.map(String).includes(req.user._id.toString()) ? 1 : 0,
        });
      } else {
        const thread = threadMap.get(key);
        if (!dm.readBy.map(String).includes(req.user._id.toString())) {
          thread.unread += 1;
        }
      }
    }

    res.json({ threads: Array.from(threadMap.values()) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dm/unread/count — total unread DMs for current user
router.get('/unread/count', protect, async (req, res) => {
  try {
    const count = await DirectMessage.countDocuments({
      receiver: req.user._id,
      readBy: { $ne: req.user._id },
    });
    res.json({ unreadCount: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dm/post-threads/:postId — list all active DM threads on a specific post for current user
router.get('/post-threads/:postId', protect, async (req, res) => {
  try {
    const { postId } = req.params;
    if (!(await canAccessPostMessages(postId, req.user))) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const messages = await DirectMessage.find({
      post: postId,
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    })
      .populate('sender', 'name avatar role')
      .populate('receiver', 'name avatar role')
      .sort({ createdAt: -1 });

    const threadMap = new Map();
    for (const dm of messages) {
      if (!dm.sender || !dm.receiver) continue;
      const other = dm.sender._id.toString() === req.user._id.toString() ? dm.receiver : dm.sender;
      const key = other._id.toString();
      if (!threadMap.has(key)) {
        const unread = !dm.readBy.map(String).includes(req.user._id.toString()) ? 1 : 0;
        threadMap.set(key, {
          other,
          lastMessage: dm,
          unreadCount: unread,
        });
      } else {
        const thread = threadMap.get(key);
        if (!dm.readBy.map(String).includes(req.user._id.toString())) {
          thread.unreadCount += 1;
        }
      }
    }

    res.json({ threads: Array.from(threadMap.values()) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
