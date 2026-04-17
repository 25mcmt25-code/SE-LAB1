const express = require('express');
const { body, param, validationResult } = require('express-validator');

const { requireAuth } = require('../middleware/auth');
const {
  generateReport,
  getUserReports,
  getReportData,
  exportReport,
} = require('../controllers/reportController');

const router = express.Router();

// Generate a new report
router.post('/generate',
  requireAuth,
  [
    body('reportType').isString().trim().notEmpty(),
    body('parameters').optional().isObject(),
    body('parameters.startDate').optional().isISO8601(),
    body('parameters.endDate').optional().isISO8601(),
    body('parameters.status').optional().isString().trim(),
    body('parameters.cropName').optional().isString().trim(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }
    return generateReport(req, res, next);
  }
);

// Get user's reports list
router.get('/', requireAuth, getUserReports);

// Get specific report data
router.get(
  '/:reportId',
  requireAuth,
  [param('reportId').isMongoId()],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }
    return getReportData(req, res, next);
  }
);

// Export report in different formats
router.get(
  '/:reportId/export/:format',
  requireAuth,
  [
    param('reportId').isMongoId(),
    param('format').isIn(['json', 'csv', 'pdf']),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }
    return exportReport(req, res, next);
  }
);

module.exports = router;
