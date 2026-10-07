const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const DirectMessage = require('../models/DirectMessage');
const User = require('../models/User');
const { canMessageUser } = require('../utils/directMessageAccess');
const { findParticipantEngagement } = require('../utils/engagementAccess');

module.exports = (io) => {
  // Authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.userId}`);
    socket.join(`user:${socket.userId}`);

    // Join engagement room
    socket.on('join_engagement', async (engagementId, acknowledge) => {
      try {
        const engagement = await findParticipantEngagement(engagementId, socket.userId);
        if (!engagement) {
          socket.emit('chat_error', { message: 'You are not a member of this engagement' });
          return acknowledge?.({ ok: false });
        }

        const room = `engagement:${engagementId}`;
        socket.join(room);
        await Message.updateMany(
          {
            engagement: engagementId,
            sender: { $ne: socket.userId },
            readBy: { $ne: socket.userId },
          },
          { $addToSet: { readBy: socket.userId } }
        );
        acknowledge?.({ ok: true });
      } catch {
        socket.emit('chat_error', { message: 'Unable to join team chat' });
        acknowledge?.({ ok: false });
      }
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { engagementId, content, recipientIds, attachmentUrl, tempId } = data;
        const room = `engagement:${engagementId}`;
        if (!socket.rooms.has(room)) {
          return socket.emit('chat_error', { message: 'You are not authorized to send this message', tempId });
        }
        if (!content?.trim() && !attachmentUrl) {
          return socket.emit('chat_error', { message: 'Message cannot be empty', tempId });
        }
        if (content?.trim().length > 5000) {
          return socket.emit('chat_error', { message: 'Message cannot exceed 5000 characters', tempId });
        }
        const message = await Message.create({
          engagement: engagementId,
          sender: socket.userId,
          recipients: recipientIds || null,
          content: content?.trim(),
          attachmentUrl: attachmentUrl || null,
          readBy: [socket.userId],
        });
        await message.populate('sender', 'name avatar role');
        const msgObj = message.toObject();
        msgObj.tempId = tempId || null;
        io.to(room).emit('new_message', msgObj);
      } catch (err) {
        socket.emit('chat_error', { message: err.message, tempId: data?.tempId });
      }
    });

    // Mark messages as read
    socket.on('mark_read', async ({ engagementId }, acknowledge) => {
      if (!socket.rooms.has(`engagement:${engagementId}`)) {
        return acknowledge?.({ ok: false });
      }
      try {
        await Message.updateMany(
          { engagement: engagementId, sender: { $ne: socket.userId }, readBy: { $ne: socket.userId } },
          { $addToSet: { readBy: socket.userId } }
        );
        acknowledge?.({ ok: true });
      } catch {
        acknowledge?.({ ok: false });
      }
    });

    // Typing indicator
    socket.on('typing', ({ engagementId }) => {
      if (!socket.rooms.has(`engagement:${engagementId}`)) return;
      socket.to(`engagement:${engagementId}`).emit('user_typing', { userId: socket.userId });
    });

    socket.on('stop_typing', ({ engagementId }) => {
      if (!socket.rooms.has(`engagement:${engagementId}`)) return;
      socket.to(`engagement:${engagementId}`).emit('user_stop_typing', { userId: socket.userId });
    });

    // ─── Pre-bid Direct Messages ───────────────────────────────────────────

    // Join a DM thread room (postId + sorted user pair)
    socket.on('join_dm', async ({ postId, otherUserId }) => {
      try {
        const user = await User.findById(socket.userId).select('role isActive');
        if (!user?.isActive || !(await canMessageUser(postId, user, otherUserId))) {
          return socket.emit('dm_error', { message: 'Not authorized to join this conversation' });
        }
        const room = `dm:${postId}:${[socket.userId, otherUserId].sort().join(':')}`;
        socket.join(room);
      } catch {
        socket.emit('dm_error', { message: 'Unable to join this conversation' });
      }
    });

    // Send a direct message in real time
    socket.on('send_dm', async ({ postId, receiverId, content, tempId }) => {
      try {
        if (!content?.trim()) return;
        if (content.trim().length > 5000) {
          return socket.emit('dm_error', { message: 'Message cannot exceed 5000 characters' });
        }
        const user = await User.findById(socket.userId).select('role isActive');
        if (!user?.isActive || !(await canMessageUser(postId, user, receiverId))) {
          return socket.emit('dm_error', { message: 'Not authorized to send this message' });
        }
        const dm = await DirectMessage.create({
          post: postId,
          sender: socket.userId,
          receiver: receiverId,
          content: content.trim(),
          readBy: [socket.userId],
        });
        await dm.populate('sender', 'name avatar role');
        await dm.populate('receiver', 'name avatar role');
        const dmObj = dm.toObject();
        dmObj.tempId = tempId || null;
        const room = `dm:${postId}:${[socket.userId, receiverId].sort().join(':')}`;
        io.to(room).emit('new_dm', dmObj);
        io.to(`user:${receiverId}`).emit('new_dm_notification', dmObj);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Mark DMs as read
    socket.on('mark_dm_read', async ({ postId, senderId }) => {
      await DirectMessage.updateMany(
        { post: postId, sender: senderId, receiver: socket.userId, readBy: { $ne: socket.userId } },
        { $addToSet: { readBy: socket.userId } }
      );
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.userId}`);
    });
  });
};
