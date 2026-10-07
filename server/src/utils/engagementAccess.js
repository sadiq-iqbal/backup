const mongoose = require('mongoose');
const Engagement = require('../models/Engagement');

async function findParticipantEngagement(engagementId, userId) {
  if (!mongoose.isValidObjectId(engagementId) || !mongoose.isValidObjectId(userId)) {
    return null;
  }

  return Engagement.findOne({
    _id: engagementId,
    $or: [
      { client: userId },
      { trainer: userId },
      { nutritionist: userId },
    ],
  });
}

async function isEngagementParticipant(engagementId, userId) {
  return Boolean(await findParticipantEngagement(engagementId, userId));
}

module.exports = { findParticipantEngagement, isEngagementParticipant };
