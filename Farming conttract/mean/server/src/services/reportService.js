const { Report, REPORT_TYPES } = require('../models/Report');
const { Contract } = require('../models/Contract');
const { ProductListing } = require('../models/ProductListing');
const { FarmerProfile } = require('../models/FarmerProfile');
const PDFDocument = require('pdfkit');

const REPORT_TYPE_ALIASES = {
  contracts: 'contracts_summary',
  marketplace: 'marketplace_activity',
  performance: 'farmer_performance',
};

function normalizeReportType(value) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!normalized) return '';
  if (REPORT_TYPES.includes(normalized)) return normalized;
  return REPORT_TYPE_ALIASES[normalized] || '';
}

function resolveCompileArgs(arg1, arg2, arg3) {
  const typeFromFirst = normalizeReportType(arg1);
  const typeFromSecond = normalizeReportType(arg2);

  if (typeFromFirst && !typeFromSecond) {
    return { userId: arg2, reportType: typeFromFirst, parameters: arg3 || {} };
  }

  return { userId: arg1, reportType: arg2, parameters: arg3 || {} };
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toId(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value.toString === 'function') return value.toString();
  return '';
}

function toName(value, fallback = 'Unknown') {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value.name === 'string' && value.name.trim()) return value.name;
  return fallback;
}

function getContractsQuery(matchConditions) {
  const query = Contract.find(matchConditions);
  if (typeof query.populate === 'function') {
    query.populate('buyerId', 'name email');
    query.populate('farmerId', 'name email');
  }

  if (typeof query.sort === 'function') {
    return query.sort({ createdAt: -1 });
  }

  return query;
}

function validateReportParameters(reportType, parameters = {}) {
  const errors = [];
  const normalizedType = normalizeReportType(reportType);

  if (!normalizedType) {
    errors.push({ field: 'reportType', message: 'Invalid report type' });
    return errors;
  }

  const { startDate, endDate } = parameters;
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    errors.push({ field: 'dateRange', message: 'Start date cannot be after end date' });
  }

  return errors;
}

async function compileContractsSummary(userId, parameters = {}) {
  const { startDate, endDate, status, cropName } = parameters;
  const matchConditions = {};

  if (userId) {
    matchConditions.$or = [{ buyerId: userId }, { farmerId: userId }];
  }

  if (startDate || endDate) {
    matchConditions.createdAt = {};
    if (startDate) matchConditions.createdAt.$gte = new Date(startDate);
    if (endDate) matchConditions.createdAt.$lte = new Date(endDate);
  }

  if (status) {
    matchConditions.status = status;
  }

  if (cropName) {
    matchConditions.cropName = new RegExp(cropName, 'i');
  }

  const contracts = await getContractsQuery(matchConditions);

  const summary = {
    totalContracts: contracts.length,
    pendingContracts: 0,
    acceptedContracts: 0,
    rejectedContracts: 0,
    completedContracts: 0,
    statusBreakdown: {},
    cropBreakdown: {},
    totalValue: 0,
    contracts: contracts.map((contract) => ({
      id: toId(contract._id),
      cropName: contract.cropName || '',
      quantity: toNumber(contract.quantity),
      unit: contract.unit || '',
      pricePerUnit: toNumber(contract.pricePerUnit),
      totalAmount: toNumber(contract.totalAmount),
      status: contract.status || 'pending',
      buyer: toName(contract.buyerId || contract.buyer),
      farmer: toName(contract.farmerId || contract.farmer),
      createdAt: contract.createdAt || null,
    })),
  };

  for (const contract of contracts) {
    const statusKey = contract.status || 'pending';
    const cropKey = contract.cropName || 'Unknown';

    summary.statusBreakdown[statusKey] = (summary.statusBreakdown[statusKey] || 0) + 1;
    summary.cropBreakdown[cropKey] = (summary.cropBreakdown[cropKey] || 0) + 1;

    if (statusKey === 'pending') summary.pendingContracts += 1;
    if (statusKey === 'accepted') summary.acceptedContracts += 1;
    if (statusKey === 'rejected') summary.rejectedContracts += 1;
    if (statusKey === 'completed') summary.completedContracts += 1;

    summary.totalValue += toNumber(contract.totalAmount);
  }

  return summary;
}

async function compileMarketplaceActivity(userId, parameters = {}) {
  const { startDate, endDate } = parameters;
  const matchConditions = {};

  if (userId) {
    matchConditions.farmerId = userId;
  }

  if (startDate || endDate) {
    matchConditions.createdAt = {};
    if (startDate) matchConditions.createdAt.$gte = new Date(startDate);
    if (endDate) matchConditions.createdAt.$lte = new Date(endDate);
  }

  const listingQuery = ProductListing.find(matchConditions);
  const listings = typeof listingQuery.sort === 'function'
    ? await listingQuery.sort({ createdAt: -1 })
    : await listingQuery;

  const summary = {
    totalListings: listings.length,
    activeListings: 0,
    inactiveListings: 0,
    cropBreakdown: {},
    totalValue: 0,
    listings: listings.map((listing) => ({
      id: toId(listing._id),
      cropName: listing.cropName || '',
      variety: listing.variety || '',
      quantity: toNumber(listing.quantity),
      unit: listing.unit || '',
      pricePerUnit: toNumber(listing.pricePerUnit),
      location: listing.location || '',
      isActive: listing.isActive !== false,
      createdAt: listing.createdAt || null,
    })),
  };

  for (const listing of listings) {
    const isActive = listing.isActive !== false;
    if (isActive) summary.activeListings += 1;
    else summary.inactiveListings += 1;

    summary.cropBreakdown[listing.cropName || 'Unknown'] = (summary.cropBreakdown[listing.cropName || 'Unknown'] || 0) + 1;
    summary.totalValue += toNumber(listing.quantity) * toNumber(listing.pricePerUnit);
  }

  return summary;
}

async function compileFarmerPerformance(userId, parameters = {}) {
  const { startDate, endDate } = parameters;
  const matchConditions = {};

  if (userId) {
    matchConditions.farmerId = userId;
  }

  if (startDate || endDate) {
    matchConditions.createdAt = {};
    if (startDate) matchConditions.createdAt.$gte = new Date(startDate);
    if (endDate) matchConditions.createdAt.$lte = new Date(endDate);
  }

  const contracts = await getContractsQuery(matchConditions);
  const profileQuery = FarmerProfile.findOne({ userId });
  const profile = typeof profileQuery.select === 'function'
    ? await profileQuery.select('crops region')
    : await profileQuery;

  return {
    totalContracts: contracts.length,
    acceptedContracts: contracts.filter((contract) => contract.status === 'accepted').length,
    rejectedContracts: contracts.filter((contract) => contract.status === 'rejected').length,
    completedContracts: contracts.filter((contract) => contract.status === 'completed').length,
    totalRevenue: contracts
      .filter((contract) => contract.status === 'completed')
      .reduce((sum, contract) => sum + toNumber(contract.totalAmount), 0),
    crops: Array.isArray(profile?.crops) ? profile.crops : [],
    region: profile?.region || '',
    contracts: contracts.map((contract) => ({
      id: toId(contract._id),
      cropName: contract.cropName || '',
      quantity: toNumber(contract.quantity),
      unit: contract.unit || '',
      totalAmount: toNumber(contract.totalAmount),
      status: contract.status || 'pending',
      buyer: toName(contract.buyerId || contract.buyer),
      createdAt: contract.createdAt || null,
    })),
  };
}

async function compileBuyerActivity(userId, parameters = {}) {
  const { startDate, endDate } = parameters;
  const matchConditions = {};

  if (userId) {
    matchConditions.buyerId = userId;
  }

  if (startDate || endDate) {
    matchConditions.createdAt = {};
    if (startDate) matchConditions.createdAt.$gte = new Date(startDate);
    if (endDate) matchConditions.createdAt.$lte = new Date(endDate);
  }

  const contracts = await getContractsQuery(matchConditions);

  return {
    totalContracts: contracts.length,
    pendingContracts: contracts.filter((contract) => contract.status === 'pending').length,
    acceptedContracts: contracts.filter((contract) => contract.status === 'accepted').length,
    completedContracts: contracts.filter((contract) => contract.status === 'completed').length,
    totalSpent: contracts
      .filter((contract) => contract.status === 'completed')
      .reduce((sum, contract) => sum + toNumber(contract.totalAmount), 0),
    contracts: contracts.map((contract) => ({
      id: toId(contract._id),
      cropName: contract.cropName || '',
      quantity: toNumber(contract.quantity),
      unit: contract.unit || '',
      totalAmount: toNumber(contract.totalAmount),
      status: contract.status || 'pending',
      farmer: toName(contract.farmerId || contract.farmer),
      createdAt: contract.createdAt || null,
    })),
  };
}

async function compileData(arg1, arg2, arg3 = {}) {
  const { userId, reportType, parameters } = resolveCompileArgs(arg1, arg2, arg3);
  const normalizedType = normalizeReportType(reportType);

  if (!normalizedType) {
    throw new Error('Invalid report type');
  }

  const errors = validateReportParameters(normalizedType, parameters);
  const nonTypeErrors = errors.filter((error) => error.field !== 'reportType');
  if (nonTypeErrors.length > 0) {
    throw new Error(`Validation failed: ${nonTypeErrors.map((error) => error.message).join(', ')}`);
  }

  if (normalizedType === 'contracts_summary') {
    return compileContractsSummary(userId, parameters);
  }

  if (normalizedType === 'marketplace_activity') {
    return compileMarketplaceActivity(userId, parameters);
  }

  if (normalizedType === 'farmer_performance') {
    return compileFarmerPerformance(userId, parameters);
  }

  return compileBuyerActivity(userId, parameters);
}

function getReportTitle(reportType, parameters = {}) {
  const normalizedType = normalizeReportType(reportType) || reportType;
  const titles = {
    contracts_summary: 'Contracts Summary Report',
    marketplace_activity: 'Marketplace Activity Report',
    farmer_performance: 'Farmer Performance Report',
    buyer_activity: 'Buyer Activity Report',
  };

  let title = titles[normalizedType] || 'Report';

  if (parameters.startDate || parameters.endDate) {
    const start = parameters.startDate ? new Date(parameters.startDate).toLocaleDateString() : 'Start';
    const end = parameters.endDate ? new Date(parameters.endDate).toLocaleDateString() : 'End';
    title += ` (${start} - ${end})`;
  }

  return title;
}

async function generateReport(userId, reportType, parameters = {}) {
  const normalizedType = normalizeReportType(reportType);
  if (!normalizedType) {
    throw new Error('Invalid report type');
  }

  const data = await module.exports.compileData(userId, normalizedType, parameters);

  return Report.create({
    userId,
    reportType: normalizedType,
    title: getReportTitle(normalizedType, parameters),
    parameters,
    data,
  });
}

function generatePDF(report) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.fontSize(20).text(report.title || 'Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(11).text(
      `Generated on: ${new Date(report.generatedAt || Date.now()).toISOString().split('T')[0]}`,
      { align: 'center' }
    );
    doc.moveDown(2);

    if (report.data && typeof report.data === 'object') {
      if (report.data.totalContracts !== undefined) {
        doc.fontSize(13).text(`Total Contracts: ${toNumber(report.data.totalContracts)}`);
      }
      if (report.data.totalValue !== undefined) {
        doc.text(`Total Value: INR ${toNumber(report.data.totalValue)}`);
      }
      if (report.data.totalRevenue !== undefined) {
        doc.text(`Total Revenue: INR ${toNumber(report.data.totalRevenue)}`);
      }
      if (report.data.totalSpent !== undefined) {
        doc.text(`Total Spent: INR ${toNumber(report.data.totalSpent)}`);
      }
      doc.moveDown();
    }

    const contracts = Array.isArray(report?.data?.contracts) ? report.data.contracts : [];
    const listings = Array.isArray(report?.data?.listings) ? report.data.listings : [];

    if (contracts.length > 0) {
      doc.fontSize(13).text('Contract Details', { underline: true });
      doc.moveDown();
      for (const contract of contracts.slice(0, 20)) {
        const line = `${contract.cropName || 'Crop'} | ${toNumber(contract.quantity)} ${contract.unit || ''} | INR ${toNumber(contract.totalAmount)} | ${contract.status || 'pending'}`;
        doc.fontSize(10).text(line);
      }
      doc.moveDown();
    }

    if (listings.length > 0) {
      doc.addPage();
      doc.fontSize(13).text('Marketplace Listings', { underline: true });
      doc.moveDown();
      for (const listing of listings.slice(0, 20)) {
        const line = `${listing.cropName || 'Crop'} | ${toNumber(listing.quantity)} ${listing.unit || ''} | INR ${toNumber(listing.pricePerUnit)} | ${listing.location || '-'}`;
        doc.fontSize(10).text(line);
      }
    }

    doc.end();
  });
}

module.exports = {
  normalizeReportType,
  validateReportParameters,
  compileData,
  generateReport,
  getReportTitle,
  generatePDF,
};