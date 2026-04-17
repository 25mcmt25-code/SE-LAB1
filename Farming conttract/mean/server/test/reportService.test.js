const test = require('node:test');
const assert = require('node:assert/strict');
const sinon = require('sinon');

const reportService = require('../src/services/reportService');
const { Report } = require('../src/models/Report');
const { Contract } = require('../src/models/Contract');
const { ProductListing } = require('../src/models/ProductListing');
const { FarmerProfile } = require('../src/models/FarmerProfile');

test('ReportService.compileData compiles contract data for contract report', async () => {
  const userId = 'user123';
  const mockContracts = [
    { buyer: { name: 'Buyer1' }, farmer: { name: 'Farmer1' }, status: 'completed', totalAmount: 1000 },
    { buyer: { name: 'Buyer2' }, farmer: { name: 'Farmer2' }, status: 'pending', totalAmount: 2000 }
  ];

  const contractQuery = {
    populate: sinon.stub(),
    sort: sinon.stub().resolves(mockContracts)
  };
  contractQuery.populate.withArgs('buyerId', 'name email').returns(contractQuery);
  contractQuery.populate.withArgs('farmerId', 'name email').returns(contractQuery);
  const contractStub = sinon.stub(Contract, 'find').returns(contractQuery);

  const result = await reportService.compileData(userId, 'contracts_summary', {});

  assert.equal(result.totalContracts, 2);
  assert.equal(result.completedContracts, 1);
  assert.equal(result.pendingContracts, 1);
  assert.equal(result.totalValue, 3000);

  contractStub.restore();
});

test('ReportService.compileData compiles marketplace data for marketplace report', async () => {
  const userId = 'user123';
  const mockListings = [
    { cropName: 'Wheat', quantity: 100, pricePerUnit: 10, isActive: true },
    { cropName: 'Rice', quantity: 200, pricePerUnit: 15, isActive: false }
  ];

  const listingQuery = {
    sort: sinon.stub().resolves(mockListings)
  };
  const productStub = sinon.stub(ProductListing, 'find').returns(listingQuery);

  const result = await reportService.compileData(userId, 'marketplace_activity', {});

  assert.equal(result.totalListings, 2);
  assert.equal(result.activeListings, 1);
  assert.equal(result.inactiveListings, 1);
  assert.equal(result.totalValue, 4000);

  productStub.restore();
});

test('ReportService.compileData compiles performance data for performance report', async () => {
  const userId = 'user123';
  const mockContracts = [
    { farmer: { id: userId }, status: 'completed', totalAmount: 1000, createdAt: new Date() },
    { farmer: { id: userId }, status: 'completed', totalAmount: 2000, createdAt: new Date() }
  ];
  const mockProfile = { region: 'North', crops: ['Wheat', 'Rice'] };

  const contractQuery = {
    populate: sinon.stub().returnsThis(),
    sort: sinon.stub().resolves(mockContracts)
  };
  const contractStub = sinon.stub(Contract, 'find').returns(contractQuery);

  const farmerQuery = {
    select: sinon.stub().resolves(mockProfile)
  };
  const farmerStub = sinon.stub(FarmerProfile, 'findOne').returns(farmerQuery);

  const result = await reportService.compileData('farmer_performance', userId, {});

  assert.equal(result.totalRevenue, 3000);
  assert.equal(result.completedContracts, 2);
  assert.equal(result.region, 'North');
  assert.deepEqual(result.crops, ['Wheat', 'Rice']);

  contractStub.restore();
  farmerStub.restore();
});

test('ReportService.compileData throws error for invalid report type', async () => {
  await assert.rejects(
    async () => await reportService.compileData('invalid', 'user123', {}),
    { message: 'Invalid report type' }
  );
});

test('ReportService.generateReport generates and saves a report', async () => {
  const userId = 'user123';
  const reportType = 'contracts';
  const parameters = {};
  const mockData = { totalContracts: 5, totalValue: 10000 };
  const mockReport = { id: 'report123', userId, reportType, data: mockData };

  const compileStub = sinon.stub(reportService, 'compileData').resolves(mockData);
  const reportStub = sinon.stub(Report, 'create').resolves(mockReport);

  const result = await reportService.generateReport(userId, reportType, parameters);

  assert.deepEqual(result, mockReport);
  assert(compileStub.calledOnce);
  assert(reportStub.calledOnce);

  compileStub.restore();
  reportStub.restore();
});

test('ReportService.compileData compiles buyer activity data', async () => {
  const userId = 'buyer123';
  const mockContracts = [
    { buyerId: userId, farmer: { name: 'Farmer1' }, status: 'completed', totalAmount: 1000, createdAt: new Date() },
    { buyerId: userId, farmer: { name: 'Farmer2' }, status: 'pending', totalAmount: 2000, createdAt: new Date() }
  ];

  const contractQuery = {
    populate: sinon.stub().returnsThis(),
    sort: sinon.stub().resolves(mockContracts)
  };
  const contractStub = sinon.stub(Contract, 'find').returns(contractQuery);

  const result = await reportService.compileData(userId, 'buyer_activity', {});

  assert.equal(result.totalContracts, 2);
  assert.equal(result.completedContracts, 1);
  assert.equal(result.pendingContracts, 1);
  assert.equal(result.totalSpent, 1000);

  contractStub.restore();
});

test('ReportService.generatePDF generates PDF buffer', async () => {
  const mockReport = {
    title: 'Test Report',
    reportType: 'contracts_summary',
    generatedAt: new Date('2026-01-01T00:00:00.000Z'),
    data: {
      totalContracts: 2,
      totalValue: 3000,
      contracts: [
        {
          cropName: 'Wheat',
          quantity: 100,
          unit: 'kg',
          pricePerUnit: 20,
          totalAmount: 2000,
          status: 'completed',
          buyer: 'Buyer1',
          farmer: 'Farmer1',
          createdAt: new Date()
        }
      ]
    }
  };

  const pdfBuffer = await reportService.generatePDF(mockReport);

  assert(Buffer.isBuffer(pdfBuffer));
  assert(pdfBuffer.length > 0);
});

test('ReportService.validateReportParameters validates date range', async () => {
  const errors = reportService.validateReportParameters('contracts_summary', {
    startDate: '2026-01-02',
    endDate: '2026-01-01'
  });

  assert.equal(errors.length, 1);
  assert.equal(errors[0].field, 'dateRange');
  assert.equal(errors[0].message, 'Start date cannot be after end date');
});

test('ReportService.validateReportParameters validates report type', async () => {
  const errors = reportService.validateReportParameters('invalid_type', {});

  assert.equal(errors.length, 1);
  assert.equal(errors[0].field, 'reportType');
  assert.equal(errors[0].message, 'Invalid report type');
});