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

router.post(
  '/register',
  [
    body('name').isString().trim().isLength({ min: 2, max: 80 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 8, max: 100 }),
    body('role').isIn(USER_ROLES),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation error', errors: errors.array() });
      }

      const { name, email, password, role } = req.body;

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ message: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await User.create({ name, email, passwordHash, role });

      const token = signToken(user);

      return res.status(201).json({
        token,
        user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
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
        user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      return next(err);
    }
  }
);

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('name email role');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    return next(err);
  }
});

router.get('/validate', requireAuth, (req, res) => {
  return res.json({ valid: true, user: req.user });
});

// In-memory store for reset tokens (in production, use database with expiration)
const resetTokens = new Map();

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
        // Don't reveal if email exists or not for security
        return res.json({ message: 'If the email exists, a reset token has been sent.' });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      resetTokens.set(email, resetToken);

      // In production, send email with token
      // For demo, return token in response
      return res.json({ message: 'Reset token generated.', resetToken });
    } catch (err) {
      return next(err);
    }
  }
);

router.post(
  '/reset-password',
  [
    body('email').isEmail().normalizeEmail(),
    body('resetToken').isString().trim().isLength({ min: 1 }),
    body('newPassword').isString().isLength({ min: 8, max: 100 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation error', errors: errors.array() });
      }

      const { email, resetToken, newPassword } = req.body;

      // Check if token matches
      const storedToken = resetTokens.get(email);
      if (!storedToken || storedToken !== resetToken) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      // Find user and update password
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 12);
      await User.findByIdAndUpdate(user._id, { passwordHash: newPasswordHash });

      // Clear the reset token
      resetTokens.delete(email);

      // Generate new JWT
      const token = signToken(user);

      return res.json({
        message: 'Password updated successfully',
        token,
        user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
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
        user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
