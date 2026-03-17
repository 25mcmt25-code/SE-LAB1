const express = require('express');

const { requireAuth } = require('../middleware/auth');
const { User } = require('../models/User');
const { FarmerProfile } = require('../models/FarmerProfile');

const router = express.Router();

router.get('/farmers', requireAuth, async (req, res, next) => {
  try {
    const farmers = await FarmerProfile.find()
      .populate('userId', 'name email role')
      .select('region crops bio createdAt')
      .sort({ updatedAt: -1 });

    return res.json({
      profiles: farmers
        .filter((profile) => profile.userId && profile.userId.role === 'farmer')
        .map((profile) => ({
          id: profile.userId._id.toString(),
          name: profile.userId.name,
          email: profile.userId.email,
          role: profile.userId.role,
          region: profile.region,
          crops: profile.crops || [],
          bio: profile.bio || '',
        })),
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/buyers', requireAuth, async (req, res, next) => {
  try {
    const buyers = await User.find({ role: 'buyer' })
      .select('name email role desiredCrops createdAt')
      .sort({ createdAt: -1 });

    return res.json({
      profiles: buyers.map((buyer) => ({
        id: buyer._id.toString(),
        name: buyer.name,
        email: buyer.email,
        role: buyer.role,
        desiredCrops: buyer.desiredCrops || [],
      })),
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
