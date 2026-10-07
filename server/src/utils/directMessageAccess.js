const mongoose = require('mongoose');
const Post = require('../models/Post');
const Bid = require('../models/Bid');
const DirectMessage = require('../models/DirectMessage');
const User = require('../models/User');

async function getPostForMessaging(postId) {
  if (!mongoose.isValidObjectId(postId)) return null;
  return Post.findById(postId).select('client');
}

async function canAccessPostMessages(postId, user) {
  if (!user?._id) return false;

  const post = await getPostForMessaging(postId);
  if (!post) return false;

  if (post.client.toString() === user._id.toString()) return true;
  if (['trainer', 'nutritionist', 'admin'].includes(user.role)) return true;

  const [bid, message] = await Promise.all([
    Bid.exists({ post: postId, professional: user._id }),
    DirectMessage.exists({
      post: postId,
      $or: [{ sender: user._id }, { receiver: user._id }],
    }),
  ]);

  return Boolean(bid || message);
}

async function canMessageUser(postId, user, otherUserId) {
  if (!user?._id || !mongoose.isValidObjectId(otherUserId)) return false;
  if (user._id.toString() === otherUserId.toString()) return false;

  const [post, otherUser] = await Promise.all([
    getPostForMessaging(postId),
    User.findOne({ _id: otherUserId, isActive: true }).select('role'),
  ]);
  if (!post || !otherUser) return false;

  const userIsOwner = post.client.toString() === user._id.toString();
  const otherIsOwner = post.client.toString() === otherUser._id.toString();
  const userIsProfessional = ['trainer', 'nutritionist'].includes(user.role);
  const otherIsProfessional = ['trainer', 'nutritionist'].includes(otherUser.role);

  if ((userIsOwner && otherIsProfessional) || (otherIsOwner && userIsProfessional)) {
    return true;
  }

  return Boolean(await DirectMessage.exists({
    post: postId,
    $or: [
      { sender: user._id, receiver: otherUserId },
      { sender: otherUserId, receiver: user._id },
    ],
  }));
}

module.exports = { canAccessPostMessages, canMessageUser };
