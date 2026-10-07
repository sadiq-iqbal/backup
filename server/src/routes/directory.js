const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ProfessionalProfile = require('../models/ProfessionalProfile');
const ClientProfile = require('../models/ClientProfile');

// GET /api/directory — browse all professionals & clients saved in database
router.get('/', async (req, res) => {
  try {
    const { role, specialty, minRating, maxRate, availability, language, verificationStatus, search, page = 1, limit = 1000 } = req.query;

    const userFilter = { isActive: true };
    if (role === 'client') {
      userFilter.role = 'client';
    } else if (role && ['trainer', 'nutritionist'].includes(role)) {
      userFilter.role = role;
    } else {
      // Default: show all professionals (trainers + nutritionists)
      userFilter.role = { $in: ['trainer', 'nutritionist'] };
    }

    if (search) {
      userFilter.name = { $regex: search, $options: 'i' };
    }

    const users = await User.find(userFilter)
      .select('name avatar role isVerified createdAt')
      .sort({ createdAt: -1 });

    const userIds = users.map(u => u._id);

    const [profProfiles, clientProfiles] = await Promise.all([
      ProfessionalProfile.find({ user: { $in: userIds } }).lean(),
      ClientProfile.find({ user: { $in: userIds } }).lean(),
    ]);

    const profMap = new Map(profProfiles.map(p => [p.user.toString(), p]));
    const clientMap = new Map(clientProfiles.map(c => [c.user.toString(), c]));

    let results = users.map(user => {
      const uObj = user.toObject();
      if (user.role === 'client') {
        const cProf = clientMap.get(user._id.toString()) || {};
        return {
          ...cProf,
          user: uObj,
        };
      } else {
        const pProf = profMap.get(user._id.toString()) || {};
        return {
          ...pProf,
          user: uObj,
        };
      }
    });

    // Apply optional professional filters if requested
    if (specialty) {
      const specs = specialty.split(',');
      results = results.filter(item => item.specialty && specs.some(s => item.specialty.includes(s)));
    }
    if (minRating) {
      results = results.filter(item => item.user.role === 'client' || (item.avgRating && item.avgRating >= Number(minRating)));
    }
    if (maxRate) {
      results = results.filter(item => item.user.role === 'client' || (item.hourlyRate && item.hourlyRate <= Number(maxRate)));
    }
    if (availability) {
      results = results.filter(item => item.user.role === 'client' || item.availabilityStatus === availability);
    }
    if (language) {
      const langs = language.split(',');
      results = results.filter(item => item.user.role === 'client' || (item.languages && langs.some(l => item.languages.includes(l))));
    }
    if (verificationStatus) {
      results = results.filter(item => item.verificationStatus === verificationStatus);
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const paginated = results.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({ professionals: paginated, members: paginated, total: results.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
