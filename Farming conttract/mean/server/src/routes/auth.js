const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const { User, USER_ROLES } = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  const payload = { userId: user._id.toString(), role: user.role };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function detectCardBrand(cardNumber) {
  if (/^4/.test(cardNumber)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(cardNumber)) return 'Mastercard';
  if (/^3[47]/.test(cardNumber)) return 'Amex';
  if (/^6(?:011|5)/.test(cardNumber)) return 'Discover';
  return 'Card';
}

function buildSavedCard(payload, role) {
  if (role !== 'buyer') return undefined;

  const cardNumber = String(payload?.cardNumber || '').replace(/\D/g, '');
  const cardHolderName = String(payload?.cardHolderName || '').trim();
  const expiryMonth = String(payload?.expiryMonth || '').trim();
  const expiryYear = String(payload?.expiryYear || '').trim();

  if (!cardNumber || !cardHolderName || !expiryMonth || !expiryYear) {
    return undefined;
  }

  return {
    cardHolderName,
    cardBrand: detectCardBrand(cardNumber),
    last4: cardNumber.slice(-4),
    expiryMonth,
    expiryYear,
  };
}

router.post(
  '/register',
  [
    body('name').isString().trim().isLength({ min: 2, max: 80 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 8, max: 100 }),
    body('role').isIn(USER_ROLES),
    body('desiredCrops').optional().isArray(),
    body('desiredCrops.*').optional().isString().trim().isLength({ min: 1, max: 60 }),
    body('savedCard').optional().isObject(),
    body('savedCard.cardHolderName').optional().isString().trim().isLength({ min: 2, max: 120 }),
    body('savedCard.cardNumber').optional().isString().trim().matches(/^\d{12,19}$/),
    body('savedCard.expiryMonth').optional().isString().trim().matches(/^(0[1-9]|1[0-2])$/),
    body('savedCard.expiryYear').optional().isString().trim().matches(/^\d{4}$/),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation error', errors: errors.array() });
      }

      const { name, email, password, role } = req.body;
      const desiredCrops = role === 'buyer' && Array.isArray(req.body.desiredCrops)
        ? req.body.desiredCrops.map((crop) => String(crop).trim()).filter(Boolean)
        : [];
      const savedCard = buildSavedCard(req.body.savedCard, role);

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ message: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await User.create({ name, email, passwordHash, role, desiredCrops, savedCard });

      const token = signToken(user);

      return res.status(201).json({
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          desiredCrops: user.desiredCrops || [],
          savedCard: user.savedCard || null,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').isString().isLength({ min: 1 })],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation error', errors: errors.array() });
      }

      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = signToken(user);

      return res.json({
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          desiredCrops: user.desiredCrops || [],
          savedCard: user.savedCard || null,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('name email role desiredCrops savedCard');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        desiredCrops: user.desiredCrops || [],
        savedCard: user.savedCard || null,
      }
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/validate', requireAuth, (req, res) => {
  return res.json({ valid: true, user: req.user });
});

router.put(
  '/buyer-payment/me',
  requireAuth,
  [
    body('cardHolderName').isString().trim().isLength({ min: 2, max: 120 }),
    body('cardNumber').isString().trim().matches(/^\d{12,19}$/),
    body('expiryMonth').isString().trim().matches(/^(0[1-9]|1[0-2])$/),
    body('expiryYear').isString().trim().matches(/^\d{4}$/),
  ],
  async (req, res, next) => {
    try {
      if (req.user.role !== 'buyer') {
        return res.status(403).json({ message: 'Only buyers can save payment cards' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation error', errors: errors.array() });
      }

      const savedCard = buildSavedCard(req.body, 'buyer');
      const user = await User.findByIdAndUpdate(
        req.user.userId,
        { $set: { savedCard } },
        { new: true }
      ).select('name email role desiredCrops savedCard');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json({
        message: 'Buyer card saved',
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          desiredCrops: user.desiredCrops || [],
          savedCard: user.savedCard || null,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation error', errors: errors.array() });
      }

      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res.json({ message: 'If the email exists, a reset link will be generated.' });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      user.resetPasswordTokenHash = resetTokenHash;
      user.resetPasswordExpiresAt = expiresAt;
      await user.save();

      return res.json({ message: 'Reset token generated', resetToken });
    } catch (err) {
      return next(err);
    }
  }
);

router.post(
  '/reset-password',
  [
    body('email').isEmail().normalizeEmail(),
    body('resetToken').isString().isLength({ min: 10 }),
    body('newPassword').isString().isLength({ min: 8, max: 100 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation error', errors: errors.array() });
      }

      const { email, resetToken, newPassword } = req.body;
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

      const user = await User.findOne({
        email,
        resetPasswordTokenHash: resetTokenHash,
        resetPasswordExpiresAt: { $gt: new Date() },
      });

      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      user.passwordHash = await bcrypt.hash(newPassword, 12);
      user.resetPasswordTokenHash = undefined;
      user.resetPasswordExpiresAt = undefined;
      await user.save();

      const token = signToken(user);

      return res.json({
        message: 'Password reset successful',
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          desiredCrops: user.desiredCrops || [],
          savedCard: user.savedCard || null,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
