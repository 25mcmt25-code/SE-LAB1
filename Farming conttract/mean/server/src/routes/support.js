const express = require('express');
const { body, param, query, validationResult } = require('express-validator');

const { requireAuth } = require('../middleware/auth');
const {
  createSupportTicket,
  getUserSupportTickets,
  getSupportTicket,
} = require('../controllers/supportController');

const router = express.Router();

// Create a new support ticket
router.post('/',
  requireAuth,
  [
    body('subject').isString().trim().isLength({ min: 5, max: 200 }),
    body('category').isIn(['technical', 'account', 'contract', 'payment', 'other']),
    body('description').isString().trim().isLength({ min: 10, max: 1000 }),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }
    return createSupportTicket(req, res, next);
  }
);

// Get user's support tickets
router.get('/',
  requireAuth,
  [
    query('status').optional().isIn(['open', 'in_progress', 'resolved', 'closed']),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }
    return getUserSupportTickets(req, res, next);
  }
);

// Get specific support ticket
router.get(
  '/:ticketId',
  requireAuth,
  [param('ticketId').isMongoId()],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }
    return getSupportTicket(req, res, next);
  }
);

module.exports = router;