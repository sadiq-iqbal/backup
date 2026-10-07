const Notification = require('../models/Notification');

const createNotification = async (userId, type, message, link = '', metadata = {}) => {
  try {
    await Notification.create({ user: userId, type, message, link, metadata });
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

module.exports = { createNotification };
