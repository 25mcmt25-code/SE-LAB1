const express = require('express');
const { body, validationResult } = require('express-validator');

const { requireAuth } = require('../middleware/auth');
const { FarmerProfile } = require('../models/FarmerProfile');

const router = express.Router();

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'farmer') {
      return res.status(403).json({ message: 'Only farmers can access farmer profiles' });
    }

    const profile = await FarmerProfile.findOne({ userId: req.user.userId }).select(
      'region crops bio upiId bank.accountHolderName bank.accountNumber bank.ifsc bank.bankName'
    );
    if (!profile) return res.json({ profile: null });

    return res.json({
      profile: {
        region: profile.region,
        crops: profile.crops,
        bio: profile.bio || '',
        upiId: profile.upiId || '',
        bank: {
          accountHolderName: profile.bank?.accountHolderName || '',
          accountNumber: profile.bank?.accountNumber || '',
          ifsc: profile.bank?.ifsc || '',
          bankName: profile.bank?.bankName || '',
        },
      },
    });
  } catch (err) {
    return next(err);
  }
});

router.put(
  '/me',
  requireAuth,
  [
    body('region').isString().trim().isLength({ min: 2, max: 120 }),
    body('crops').optional().isArray(),
    body('crops.*').optional().isString().trim().isLength({ min: 1, max: 60 }),
    body('bio').optional().isString().trim().isLength({ max: 500 }),
    body('upiId').optional().isString().trim().isLength({ max: 80 }),
    body('bank').optional().isObject(),
    body('bank.accountHolderName').optional().isString().trim().isLength({ max: 120 }),
    body('bank.accountNumber').optional().isString().trim().isLength({ max: 30 }),
    body('bank.ifsc').optional().isString().trim().isLength({ max: 20 }),
    body('bank.bankName').optional().isString().trim().isLength({ max: 120 }),
  ],
  async (req, res, next) => {
    try {
      if (req.user.role !== 'farmer') {
        return res.status(403).json({ message: 'Only farmers can update farmer profiles' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation error', errors: errors.array() });
      }

      const region = String(req.body.region || '').trim();
      const crops = Array.isArray(req.body.crops) ? req.body.crops.map((c) => String(c).trim()).filter(Boolean) : [];
      const bio = typeof req.body.bio === 'string' ? req.body.bio.trim() : '';
      const upiId = typeof req.body.upiId === 'string' ? req.body.upiId.trim() : '';
      const bank = typeof req.body.bank === 'object' && req.body.bank
        ? {
            accountHolderName: typeof req.body.bank.accountHolderName === 'string' ? req.body.bank.accountHolderName.trim() : '',
            accountNumber: typeof req.body.bank.accountNumber === 'string' ? req.body.bank.accountNumber.trim() : '',
            ifsc: typeof req.body.bank.ifsc === 'string' ? req.body.bank.ifsc.trim() : '',
            bankName: typeof req.body.bank.bankName === 'string' ? req.body.bank.bankName.trim() : '',
          }
        : { accountHolderName: '', accountNumber: '', ifsc: '', bankName: '' };

      const profile = await FarmerProfile.findOneAndUpdate(
        { userId: req.user.userId },
        { $set: { region, crops, bio, upiId, bank } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).select('region crops bio upiId bank.accountHolderName bank.accountNumber bank.ifsc bank.bankName');

      return res.json({
        message: 'Profile saved',
        profile: {
          region: profile.region,
          crops: profile.crops,
          bio: profile.bio || '',
          upiId: profile.upiId || '',
          bank: {
            accountHolderName: profile.bank?.accountHolderName || '',
            accountNumber: profile.bank?.accountNumber || '',
            ifsc: profile.bank?.ifsc || '',
            bankName: profile.bank?.bankName || '',
          },
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
