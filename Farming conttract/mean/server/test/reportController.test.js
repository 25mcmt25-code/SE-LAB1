const test = require('node:test');
const assert = require('node:assert/strict');
const sinon = require('sinon');

const reportController = require('../src/controllers/reportController');
const reportService = require('../src/services/reportService');
const { Report } = require('../src/models/Report');

test('generateReport generates a report successfully', async () => {
  const req = {
    user: { userId: 'user123' },
    body: { reportType: 'contracts', parameters: {} }
  };
  const res = {
    status: sinon.stub().returnsThis(),
    json: sinon.stub().returnsThis()
  };
  const next = sinon.stub();

  const mockReport = {
    _id: { toString: () => 'report123' },
    reportType: 'contracts',
    title: 'Contracts Summary Report',
    generatedAt: new Date('2026-01-01T00:00:00.000Z'),
    expiresAt: new Date('2026-01-08T00:00:00.000Z')
  };
  const serviceStub = sinon.stub(reportService, 'generateReport').resolves(mockReport);

  await reportController.generateReport(req, res, next);

  assert(res.status.calledWith(201));
  assert(res.json.calledWith({
    message: 'Report generated successfully',
    report: {
      id: 'report123',
      reportType: 'contracts',
      title: 'Contracts Summary Report',
      generatedAt: mockReport.generatedAt,
      expiresAt: mockReport.expiresAt,
    }
  }));

  serviceStub.restore();
});

test('generateReport handles service errors', async () => {
  const req = {
    user: { userId: 'user123' },
    body: { reportType: 'contracts', parameters: {} }
  };
  const res = {
    status: sinon.stub().returnsThis(),
    json: sinon.stub().returnsThis()
  };
  const next = sinon.stub();

  const error = new Error('Service error');
  const serviceStub = sinon.stub(reportService, 'generateReport').rejects(error);

  await reportController.generateReport(req, res, next);

  assert(next.calledWith(error));

  serviceStub.restore();
});

test('getUserReports returns user reports', async () => {
  const req = { user: { userId: 'user123' } };
  const res = {
    json: sinon.stub().returnsThis()
  };
  const next = sinon.stub();

  const mockReports = [
    {
      _id: { toString: () => 'report1' },
      reportType: 'contracts_summary',
      title: 'Contracts Summary Report',
      generatedAt: new Date('2026-01-01T00:00:00.000Z'),
      expiresAt: new Date('2026-01-08T00:00:00.000Z')
    },
    {
      _id: { toString: () => 'report2' },
      reportType: 'marketplace_activity',
      title: 'Marketplace Activity Report',
      generatedAt: new Date('2026-01-02T00:00:00.000Z'),
      expiresAt: new Date('2026-01-09T00:00:00.000Z')
    }
  ];

  const reportQuery = {
    sort: sinon.stub().resolves(mockReports)
  };
  const reportStub = sinon.stub(Report, 'find').returns(reportQuery);

  await reportController.getUserReports(req, res, next);

  assert(res.json.calledWith({
    reports: [
      {
        id: 'report1',
        reportType: 'contracts_summary',
        title: 'Contracts Summary Report',
        generatedAt: mockReports[0].generatedAt,
        expiresAt: mockReports[0].expiresAt,
      },
      {
        id: 'report2',
        reportType: 'marketplace_activity',
        title: 'Marketplace Activity Report',
        generatedAt: mockReports[1].generatedAt,
        expiresAt: mockReports[1].expiresAt,
      }
    ]
  }));

  reportStub.restore();
});

test('getUserReports handles database errors', async () => {
  const req = { user: { userId: 'user123' } };
  const res = {
    json: sinon.stub().returnsThis()
  };
  const next = sinon.stub();

  const error = new Error('Database error');
  const reportStub = sinon.stub(Report, 'find').rejects(error);

  await reportController.getUserReports(req, res, next);

  assert(next.calledWith(error));

  reportStub.restore();
});

test('exportReport exports report as JSON', async () => {
  const req = {
    user: { userId: 'user123' },
    params: { reportId: 'report123', format: 'json' }
  };
  const res = {
    setHeader: sinon.stub().returnsThis(),
    send: sinon.stub().returnsThis()
  };
  const next = sinon.stub();

  const mockReport = {
    id: 'report123',
    reportType: 'contracts',
    data: { totalContracts: 5 },
    toObject: sinon.stub().returns({
      id: 'report123',
      reportType: 'contracts',
      data: { totalContracts: 5 }
    })
  };

  const findStub = sinon.stub(Report, 'findOne').resolves(mockReport);

  await reportController.exportReport(req, res, next);

  assert(res.setHeader.calledWith('Content-Type', 'application/json'));
  assert(res.setHeader.calledWith('Content-Disposition', 'attachment; filename="report-contracts.json"'));
  assert(res.send.calledOnce);

  findStub.restore();
});

test('exportReport exports report as CSV', async () => {
  const req = {
    user: { userId: 'user123' },
    params: { reportId: 'report123', format: 'csv' }
  };
  const res = {
    setHeader: sinon.stub().returnsThis(),
    send: sinon.stub().returnsThis()
  };
  const next = sinon.stub();

  const mockReport = {
    id: 'report123',
    reportType: 'contracts',
    data: {
      totalContracts: 5,
      completedContracts: 3,
      pendingContracts: 2,
      totalValue: 10000
    }
  };

  const findStub = sinon.stub(Report, 'findOne').resolves(mockReport);

  await reportController.exportReport(req, res, next);

  assert(res.setHeader.calledWith('Content-Type', 'text/csv'));
  assert(res.setHeader.calledWith('Content-Disposition', 'attachment; filename="report-contracts.csv"'));
  assert(res.send.calledOnce);

  findStub.restore();
});

test('exportReport returns 404 for non-existent report', async () => {
  const req = {
    user: { userId: 'user123' },
    params: { reportId: 'invalid', format: 'json' }
  };
  const res = {
    status: sinon.stub().returnsThis(),
    json: sinon.stub().returnsThis()
  };
  const next = sinon.stub();

  const findStub = sinon.stub(Report, 'findOne').resolves(null);

  await reportController.exportReport(req, res, next);

  assert(res.status.calledWith(404));
  assert(res.json.calledWith({ message: 'Report not found' }));

  findStub.restore();
});

test('exportReport returns 403 for unauthorized access', async () => {
  const req = {
    user: { userId: 'user123' },
    params: { reportId: 'report123', format: 'json' }
  };
  const res = {
    status: sinon.stub().returnsThis(),
    json: sinon.stub().returnsThis()
  };
  const next = sinon.stub();

  const mockReport = { id: 'report123', userId: 'otherUser' };
  const findStub = sinon.stub(Report, 'findOne').resolves(mockReport);

  await reportController.exportReport(req, res, next);

  assert(res.status.calledWith(403));
  assert(res.json.calledWith({ message: 'Access denied' }));

  findStub.restore();
});

test('getReportData returns report data', async () => {
  const req = {
    user: { userId: 'user123' },
    params: { reportId: 'report123' }
  };
  const res = {
    json: sinon.stub().returnsThis()
  };
  const next = sinon.stub();

  const mockReport = {
    _id: { toString: () => 'report123' },
    userId: 'user123',
    reportType: 'contracts_summary',
    title: 'Contracts Summary Report',
    parameters: {},
    data: { totalContracts: 5 },
    generatedAt: new Date('2026-01-01T00:00:00.000Z'),
    expiresAt: new Date('2026-01-08T00:00:00.000Z')
  };

  const findStub = sinon.stub(Report, 'findOne').resolves(mockReport);

  await reportController.getReportData(req, res, next);

  assert(res.json.calledWith({
    report: {
      id: 'report123',
      reportType: 'contracts_summary',
      title: 'Contracts Summary Report',
      parameters: {},
      data: { totalContracts: 5 },
      generatedAt: mockReport.generatedAt,
      expiresAt: mockReport.expiresAt,
    }
  }));

  findStub.restore();
});

test('getReportData returns 404 for non-existent report', async () => {
  const req = {
    user: { userId: 'user123' },
    params: { reportId: 'invalid' }
  };
  const res = {
    status: sinon.stub().returnsThis(),
    json: sinon.stub().returnsThis()
  };
  const next = sinon.stub();

  const findStub = sinon.stub(Report, 'findOne').resolves(null);

  await reportController.getReportData(req, res, next);

  assert(res.status.calledWith(404));
  assert(res.json.calledWith({ message: 'Report not found' }));

  findStub.restore();
});

test('exportReport returns 400 for invalid format', async () => {
  const req = {
    user: { userId: 'user123' },
    params: { reportId: 'report123', format: 'invalid' }
  };
  const res = {
    status: sinon.stub().returnsThis(),
    json: sinon.stub().returnsThis()
  };
  const next = sinon.stub();

  await reportController.exportReport(req, res, next);

  assert(res.status.calledWith(400));
  assert(res.json.calledWith({ message: 'Invalid format. Supported formats: json, csv, pdf' }));
});

test('exportReport exports report as PDF', async () => {
  const req = {
    user: { userId: 'user123' },
    params: { reportId: 'report123', format: 'pdf' }
  };
  const res = {
    setHeader: sinon.stub().returnsThis(),
    send: sinon.stub().returnsThis()
  };
  const next = sinon.stub();

  const mockReport = {
    id: 'report123',
    reportType: 'contracts_summary',
    title: 'Contracts Summary Report',
    data: { totalContracts: 5 },
    generatedAt: new Date('2026-01-01T00:00:00.000Z')
  };

  const findStub = sinon.stub(Report, 'findOne').resolves(mockReport);
  const pdfStub = sinon.stub(reportService, 'generatePDF').resolves(Buffer.from('pdf content'));

  await reportController.exportReport(req, res, next);

  assert(res.setHeader.calledWith('Content-Type', 'application/pdf'));
  assert(res.setHeader.calledWith('Content-Disposition', 'attachment; filename="Contracts_Summary_Report_2026-01-01.pdf"'));
  assert(res.send.calledOnce);

  findStub.restore();
  pdfStub.restore();
});

test('exportReport exports CSV for marketplace activity', async () => {
  const req = {
    user: { userId: 'user123' },
    params: { reportId: 'report123', format: 'csv' }
  };
  const res = {
    setHeader: sinon.stub().returnsThis(),
    send: sinon.stub().returnsThis()
  };
  const next = sinon.stub();

  const mockReport = {
    id: 'report123',
    reportType: 'marketplace_activity',
    title: 'Marketplace Activity Report',
    data: {
      listings: [
        { cropName: 'Wheat', variety: 'Hard Red', quantity: 100, unit: 'kg', pricePerUnit: 20, location: 'Farm A', createdAt: new Date() }
      ]
    },
    generatedAt: new Date('2026-01-01T00:00:00.000Z')
  };

  const findStub = sinon.stub(Report, 'findOne').resolves(mockReport);

  await reportController.exportReport(req, res, next);

  assert(res.setHeader.calledWith('Content-Type', 'text/csv'));
  assert(res.setHeader.calledWith('Content-Disposition', 'attachment; filename="Marketplace_Activity_Report_2026-01-01.csv"'));
  assert(res.send.calledOnce);

  findStub.restore();
});