const express = require('express');
const { param, validationResult } = require('express-validator');

const { requireAuth } = require('../middleware/auth');
const { User } = require('../models/User');
const profileRepository = require('../repositories/profileRepository');
const { searchFarmers } = require('../services/searchService');

const router = express.Router();

router.get('/farmers', requireAuth, async (req, res, next) => {
  try {
    const farmers = await searchFarmers(req.query);

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
          profilePhoto: profile.userId.profilePhoto || '',
        })),
    });
  } catch (err) {
    return next(err);
  }
});

router.get(
  '/farmers/:farmerId',
  requireAuth,
  [param('farmerId').isMongoId()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation error', errors: errors.array() });
      }

      const profile = await profileRepository.fetchProfile(req.params.farmerId);
      if (!profile || !profile.userId || profile.userId.role !== 'farmer') {
        return res.status(404).json({ message: 'Farmer profile not found' });
      }

      return res.json({
        profile: {
          id: profile.userId._id.toString(),
          name: profile.userId.name,
          email: profile.userId.email,
          role: profile.userId.role,
          region: profile.region,
          crops: profile.crops || [],
          bio: profile.bio || '',
          profilePhoto: profile.userId.profilePhoto || '',
          updatedAt: profile.updatedAt ? new Date(profile.updatedAt).toISOString() : null,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

router.get('/buyers', requireAuth, async (req, res, next) => {
  try {
    const buyers = await User.find({ role: 'buyer' })
      .select('name email role desiredCrops profilePhoto createdAt')
      .sort({ createdAt: -1 });

    return res.json({
      profiles: buyers.map((buyer) => ({
        id: buyer._id.toString(),
        name: buyer.name,
        email: buyer.email,
        role: buyer.role,
        desiredCrops: buyer.desiredCrops || [],
        profilePhoto: buyer.profilePhoto || '',
      })),
    });
  } catch (err) {
    return next(err);
  }
});

router.get(
  '/buyers/:buyerId',
  requireAuth,
  [param('buyerId').isMongoId()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation error', errors: errors.array() });
      }

      const buyer = await User.findOne({ _id: req.params.buyerId, role: 'buyer' })
        .select('name email role desiredCrops profilePhoto createdAt updatedAt');
      if (!buyer) {
        return res.status(404).json({ message: 'Buyer profile not found' });
      }

      return res.json({
        profile: {
          id: buyer._id.toString(),
          name: buyer.name,
          email: buyer.email,
          role: buyer.role,
          desiredCrops: buyer.desiredCrops || [],
          profilePhoto: buyer.profilePhoto || '',
          createdAt: buyer.createdAt ? new Date(buyer.createdAt).toISOString() : null,
          updatedAt: buyer.updatedAt ? new Date(buyer.updatedAt).toISOString() : null,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
