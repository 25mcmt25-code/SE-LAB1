const express = require('express');
const { body, param, validationResult } = require('express-validator');

const { requireAuth } = require('../middleware/auth');
const { User } = require('../models/User');
const { PaymentProof, PAYMENT_METHODS } = require('../models/PaymentProof');

const router = express.Router();
const SCREENSHOT_DATA_URL_RE = /^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/=]+$/;
const PAYMENT_ACTIONS = ['verified', 'rejected'];

function toPublicPaymentProof(proof) {
  const buyer = proof?.buyerId && typeof proof.buyerId === 'object'
    ? {
        id: proof.buyerId._id?.toString?.() || '',
        name: proof.buyerId.name || 'Buyer',
        email: proof.buyerId.email || '',
        profilePhoto: proof.buyerId.profilePhoto || '',
      }
    : { id: proof?.buyerId?.toString?.() || '', name: 'Buyer', email: '', profilePhoto: '' };

  const farmer = proof?.farmerId && typeof proof.farmerId === 'object'
    ? {
        id: proof.farmerId._id?.toString?.() || '',
        name: proof.farmerId.name || 'Farmer',
        email: proof.farmerId.email || '',
        profilePhoto: proof.farmerId.profilePhoto || '',
      }
    : { id: proof?.farmerId?.toString?.() || '', name: 'Farmer', email: '', profilePhoto: '' };

  return {
    id: proof?._id?.toString?.() || '',
    buyer,
    farmer,
    amount: Number(proof?.amount || 0),
    currency: proof?.currency || 'INR',
    paymentMethod: proof?.paymentMethod || 'other',
    referenceId: proof?.referenceId || '',
    screenshot: proof?.screenshot || '',
    notes: proof?.notes || '',
    status: proof?.status || 'submitted',
    farmerRemarks: proof?.farmerRemarks || '',
    createdAt: proof?.createdAt ? new Date(proof.createdAt).toISOString() : null,
    verifiedAt: proof?.verifiedAt ? new Date(proof.verifiedAt).toISOString() : null,
  };
}

router.get('/proofs', requireAuth, async (req, res, next) => {
  try {
    const criteria = req.user.role === 'buyer'
      ? { buyerId: req.user.userId }
      : req.user.role === 'farmer'
        ? { farmerId: req.user.userId }
        : null;

    if (!criteria) {
      return res.status(403).json({ message: 'Only buyers or farmers can access payment proofs' });
    }

    const proofs = await PaymentProof.find(criteria)
      .populate('buyerId', 'name email profilePhoto')
      .populate('farmerId', 'name email profilePhoto')
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({
      proofs: proofs.map((proof) => toPublicPaymentProof(proof)),
    });
  } catch (err) {
    return next(err);
  }
});

router.post(
  '/proofs',
  requireAuth,
  [
    body('farmerId').isMongoId(),
    body('amount').isFloat({ gt: 0, lt: 100000001 }),
    body('paymentMethod').isString().trim().isIn(PAYMENT_METHODS),
    body('referenceId').optional().isString().trim().isLength({ max: 120 }),
    body('screenshot')
      .isString()
      .trim()
      .isLength({ min: 40, max: 3000000 })
      .custom((value) => {
        if (!SCREENSHOT_DATA_URL_RE.test(String(value).trim())) {
          throw new Error('Screenshot must be a PNG or JPEG image');
        }
        return true;
      }),
    body('notes').optional().isString().trim().isLength({ max: 500 }),
  ],
  async (req, res, next) => {
    try {
      if (req.user.role !== 'buyer') {
        return res.status(403).json({ message: 'Only buyers can submit payment proofs' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation error', errors: errors.array() });
      }

      const farmer = await User.findOne({ _id: req.body.farmerId, role: 'farmer' }).select('_id');
      if (!farmer) {
        return res.status(404).json({ message: 'Target farmer was not found' });
      }

      const payload = {
        buyerId: req.user.userId,
        farmerId: farmer._id,
        amount: Number(req.body.amount),
        currency: 'INR',
        paymentMethod: String(req.body.paymentMethod || '').trim(),
        referenceId: String(req.body.referenceId || '').trim(),
        screenshot: String(req.body.screenshot || '').trim(),
        notes: String(req.body.notes || '').trim(),
        status: 'submitted',
      };

      if (!payload.referenceId) delete payload.referenceId;
      if (!payload.notes) delete payload.notes;

      const created = await PaymentProof.create(payload);
      await created.populate([
        { path: 'buyerId', select: 'name email profilePhoto' },
        { path: 'farmerId', select: 'name email profilePhoto' },
      ]);

      return res.status(201).json({
        message: 'Payment proof submitted for farmer verification',
        proof: toPublicPaymentProof(created),
      });
    } catch (err) {
      return next(err);
    }
  }
);

router.put(
  '/proofs/:proofId/verify',
  requireAuth,
  [
    param('proofId').isMongoId(),
    body('action').isString().trim().isIn(PAYMENT_ACTIONS),
    body('farmerRemarks').optional().isString().trim().isLength({ max: 500 }),
  ],
  async (req, res, next) => {
    try {
      if (req.user.role !== 'farmer') {
        return res.status(403).json({ message: 'Only farmers can verify payment proofs' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation error', errors: errors.array() });
      }

      const proof = await PaymentProof.findById(req.params.proofId);
      if (!proof) {
        return res.status(404).json({ message: 'Payment proof not found' });
      }

      if (proof.farmerId.toString() !== req.user.userId) {
        return res.status(403).json({ message: 'You can only verify proofs assigned to your account' });
      }

      if (proof.status !== 'submitted') {
        return res.status(400).json({ message: 'This payment proof has already been processed' });
      }

      const action = String(req.body.action || '').trim();
      const farmerRemarks = String(req.body.farmerRemarks || '').trim();
      if (action === 'rejected' && !farmerRemarks) {
        return res.status(400).json({ message: 'Please provide a reason when rejecting payment proof' });
      }

      proof.status = action;
      proof.farmerRemarks = farmerRemarks;
      proof.verifiedBy = req.user.userId;
      proof.verifiedAt = new Date();
      await proof.save();

      await proof.populate([
        { path: 'buyerId', select: 'name email profilePhoto' },
        { path: 'farmerId', select: 'name email profilePhoto' },
      ]);

      return res.json({
        message: action === 'verified' ? 'Payment proof verified' : 'Payment proof rejected',
        proof: toPublicPaymentProof(proof),
      });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;

