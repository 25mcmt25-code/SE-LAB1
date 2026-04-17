const express = require('express');
const { body, param, validationResult } = require('express-validator');

const { requireAuth } = require('../middleware/auth');
const {
  submitContract,
  getMyContracts,
  getContractDetails,
  updateContractStatus,
} = require('../controllers/contractController');

const router = express.Router();

router.post('/',
  requireAuth,
  [
    body('farmerId').optional().isMongoId(),
    body('buyerId').optional().isMongoId(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }
    return submitContract(req, res, next);
  }
);

router.get('/my', requireAuth, getMyContracts);

router.get(
  '/:contractId',
  requireAuth,
  [param('contractId').isMongoId()],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }
    return getContractDetails(req, res, next);
  }
);

router.patch(
  '/:contractId/status',
  requireAuth,
  [
    param('contractId').isMongoId(),
    body('status').isString().trim().notEmpty(),
    body('decisionNote').optional().isString().trim().isLength({ max: 300 }),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }
    return updateContractStatus(req, res, next);
  }
);

module.exports = router;
