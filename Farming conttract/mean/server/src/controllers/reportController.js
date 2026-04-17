const { Report } = require('../models/Report');
const reportService = require('../services/reportService');

function getCurrentUserId(req) {
  return req?.user?.userId || req?.user?.id || null;
}

function toStringId(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value.toString === 'function') return value.toString();
  return '';
}

function sanitizeFilenamePart(value) {
  return String(value || 'report')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'report';
}

function buildExportFilename(report) {
  if (report?.title && report?.generatedAt) {
    const date = new Date(report.generatedAt).toISOString().split('T')[0];
    return `${sanitizeFilenamePart(report.title)}_${date}`;
  }

  const reportType = String(report?.reportType || 'report').toLowerCase();
  return `report-${reportType}`;
}

function objectToCsvRows(dataObject) {
  const rows = [['metric', 'value']];
  for (const [key, value] of Object.entries(dataObject || {})) {
    if (typeof value === 'object') continue;
    rows.push([key, value]);
  }
  return rows;
}

function convertToCSV(data, fields = null) {
  if (!Array.isArray(data) || data.length === 0) {
    return 'No data available';
  }

  const headers = fields || Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map((header) => {
      const value = row?.[header];
      if (value === null || value === undefined) return '';

      const stringValue = typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);

      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }

      return stringValue;
    });

    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

function createReportController(dependencies = {}) {
  const findReportsByUser = dependencies.findReportsByUser || ((userId) => Report.find({ userId }));
  const findReportById = dependencies.findReportById || ((reportId) => Report.findOne({ _id: reportId }));

  return {
    async generateReport(req, res, next) {
      try {
        const { reportType, parameters = {} } = req.body || {};

        if (!reportType) {
          return res.status(400).json({
            message: 'Validation error',
            errors: [{ field: 'reportType', message: 'reportType is required' }],
          });
        }

        const report = await reportService.generateReport(getCurrentUserId(req), reportType, parameters);

        return res.status(201).json({
          message: 'Report generated successfully',
          report: {
            id: toStringId(report._id || report.id),
            reportType: report.reportType,
            title: report.title,
            generatedAt: report.generatedAt,
            expiresAt: report.expiresAt,
          },
        });
      } catch (err) {
        if (typeof err?.message === 'string' && err.message.includes('Validation failed')) {
          return res.status(400).json({ message: err.message });
        }
        return next(err);
      }
    },

    async getUserReports(req, res, next) {
      try {
        const userId = getCurrentUserId(req);
        const queryOrReports = findReportsByUser(userId);
        const reports = queryOrReports && typeof queryOrReports.sort === 'function'
          ? await queryOrReports.sort({ generatedAt: -1 })
          : await queryOrReports;

        return res.json({
          reports: (reports || []).map((report) => ({
            id: toStringId(report._id || report.id),
            reportType: report.reportType,
            title: report.title,
            generatedAt: report.generatedAt,
            expiresAt: report.expiresAt,
          })),
        });
      } catch (err) {
        return next(err);
      }
    },

    async getReportData(req, res, next) {
      try {
        const currentUserId = getCurrentUserId(req);
        const { reportId } = req.params;
        const report = await findReportById(reportId, currentUserId);

        if (!report) {
          return res.status(404).json({ message: 'Report not found' });
        }

        if (report.userId && toStringId(report.userId) !== toStringId(currentUserId)) {
          return res.status(403).json({ message: 'Access denied' });
        }

        return res.json({
          report: {
            id: toStringId(report._id || report.id),
            reportType: report.reportType,
            title: report.title,
            parameters: report.parameters || {},
            data: report.data,
            generatedAt: report.generatedAt,
            expiresAt: report.expiresAt,
          },
        });
      } catch (err) {
        return next(err);
      }
    },

    async exportReport(req, res, next) {
      try {
        const { reportId, format = 'json' } = req.params;
        const currentUserId = getCurrentUserId(req);
        const validFormats = ['json', 'csv', 'pdf'];

        if (!validFormats.includes(format)) {
          return res.status(400).json({ message: 'Invalid format. Supported formats: json, csv, pdf' });
        }

        const report = await findReportById(reportId, currentUserId);
        if (!report) {
          return res.status(404).json({ message: 'Report not found' });
        }

        if (report.userId && toStringId(report.userId) !== toStringId(currentUserId)) {
          return res.status(403).json({ message: 'Access denied' });
        }

        const filename = buildExportFilename(report);

        if (format === 'pdf') {
          const pdfBuffer = await reportService.generatePDF(report);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
          return res.send(pdfBuffer);
        }

        if (format === 'csv') {
          let csvData = '';
          const data = report?.data || {};

          if (Array.isArray(data.contracts)) {
            csvData = convertToCSV(data.contracts);
          } else if (Array.isArray(data.listings)) {
            csvData = convertToCSV(data.listings);
          } else if (Array.isArray(data)) {
            csvData = convertToCSV(data);
          } else {
            csvData = convertToCSV(objectToCsvRows(data), ['metric', 'value']);
          }

          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
          return res.send(csvData);
        }

        const payload = typeof report?.toObject === 'function'
          ? report.toObject()
          : (report?.data || report);

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
        return res.send(payload);
      } catch (err) {
        return next(err);
      }
    },
  };
}

const defaultController = createReportController();

module.exports = {
  ...defaultController,
  createReportController,
  convertToCSV,
  buildExportFilename,
};