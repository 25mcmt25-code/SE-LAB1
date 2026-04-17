const { CONTRACT_UNITS, CONTRACT_STATUSES } = require('../models/Contract');

const CROP_NAME_MAX = 60;
const LOCATION_MAX = 120;
const NOTES_MAX = 500;
const DECISION_NOTE_MAX = 300;
const MAX_QUANTITY = 1000000;
const MAX_PRICE = 100000000;
const MAX_TOTAL = 1000000000;

function toTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value.trim());
  return Number.NaN;
}

function toOptionalDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function validateContractPayload(payload) {
  const errors = [];
  const cropName = toTrimmedString(payload?.cropName);
  const quantity = toNumber(payload?.quantity);
  const unit = toTrimmedString(payload?.unit).toLowerCase();
  const pricePerUnit = toNumber(payload?.pricePerUnit);
  const deliveryLocation = toTrimmedString(payload?.deliveryLocation);
  const notes = toTrimmedString(payload?.notes);
  const expectedDeliveryDate = toOptionalDate(payload?.expectedDeliveryDate);

  if (!cropName || cropName.length < 2 || cropName.length > CROP_NAME_MAX) {
    errors.push({
      field: 'cropName',
      message: `cropName is required and must be between 2 and ${CROP_NAME_MAX} characters`,
    });
  }

  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > MAX_QUANTITY) {
    errors.push({
      field: 'quantity',
      message: `quantity must be a number between 0 and ${MAX_QUANTITY}`,
    });
  }

  if (!CONTRACT_UNITS.includes(unit)) {
    errors.push({
      field: 'unit',
      message: `unit must be one of: ${CONTRACT_UNITS.join(', ')}`,
    });
  }

  if (!Number.isFinite(pricePerUnit) || pricePerUnit <= 0 || pricePerUnit > MAX_PRICE) {
    errors.push({
      field: 'pricePerUnit',
      message: `pricePerUnit must be a number between 0 and ${MAX_PRICE}`,
    });
  }

  if (!deliveryLocation || deliveryLocation.length < 2 || deliveryLocation.length > LOCATION_MAX) {
    errors.push({
      field: 'deliveryLocation',
      message: `deliveryLocation is required and must be between 2 and ${LOCATION_MAX} characters`,
    });
  }

  if (notes && notes.length > NOTES_MAX) {
    errors.push({
      field: 'notes',
      message: `notes must be at most ${NOTES_MAX} characters`,
    });
  }

  if (payload?.expectedDeliveryDate && !expectedDeliveryDate) {
    errors.push({
      field: 'expectedDeliveryDate',
      message: 'expectedDeliveryDate must be a valid date',
    });
  }

  const totalAmount = Number.isFinite(quantity) && Number.isFinite(pricePerUnit)
    ? Number((quantity * pricePerUnit).toFixed(2))
    : Number.NaN;
  if (Number.isFinite(totalAmount) && (totalAmount <= 0 || totalAmount > MAX_TOTAL)) {
    errors.push({
      field: 'totalAmount',
      message: `totalAmount must be between 0 and ${MAX_TOTAL}`,
    });
  }

  return errors;
}

function buildContractPayload(payload, buyerId, farmerId, initiatorRole = 'buyer') {
  const quantity = toNumber(payload?.quantity);
  const pricePerUnit = toNumber(payload?.pricePerUnit);
  const totalAmount = Number((quantity * pricePerUnit).toFixed(2));
  const expectedDeliveryDate = toOptionalDate(payload?.expectedDeliveryDate);

  const normalized = {
    buyerId,
    farmerId,
    cropName: toTrimmedString(payload?.cropName),
    quantity,
    unit: toTrimmedString(payload?.unit).toLowerCase(),
    pricePerUnit,
    totalAmount,
    deliveryLocation: toTrimmedString(payload?.deliveryLocation),
    expectedDeliveryDate: expectedDeliveryDate || undefined,
    notes: toTrimmedString(payload?.notes),
    status: 'pending',
    notifications: [
      {
        recipientRole: initiatorRole === 'farmer' ? 'buyer' : 'farmer',
        message: initiatorRole === 'farmer'
          ? 'New contract request received from farmer.'
          : 'New contract request received from buyer.',
      },
    ],
  };

  if (!normalized.notes) delete normalized.notes;
  if (!normalized.expectedDeliveryDate) delete normalized.expectedDeliveryDate;

  return normalized;
}

function validateStatusTransition(currentStatus, nextStatus, actorRole) {
  if (!CONTRACT_STATUSES.includes(nextStatus)) {
    return 'Invalid contract status';
  }

  if (currentStatus !== 'pending') {
    return 'Only pending contracts can be updated';
  }

  if (actorRole === 'farmer' && !['accepted', 'rejected'].includes(nextStatus)) {
    return 'Farmers can only accept or reject pending contracts';
  }

  if (actorRole === 'buyer' && nextStatus !== 'cancelled') {
    return 'Buyers can only cancel pending contracts';
  }

  return '';
}

function buildStatusUpdate({ contract, nextStatus, actorRole, decisionNote }) {
  const note = toTrimmedString(decisionNote);
  const notifications = Array.isArray(contract.notifications) ? [...contract.notifications] : [];

  if (actorRole === 'farmer') {
    notifications.push({
      recipientRole: 'buyer',
      message: nextStatus === 'accepted'
        ? 'Farmer accepted your contract request.'
        : 'Farmer rejected your contract request.',
    });
  } else if (actorRole === 'buyer') {
    notifications.push({
      recipientRole: 'farmer',
      message: 'Buyer cancelled the pending contract request.',
    });
  }

  return {
    status: nextStatus,
    farmerDecisionNote: actorRole === 'farmer' && note ? note : undefined,
    notifications,
  };
}

function toPublicContract(contract) {
  const buyer = contract?.buyerId && typeof contract.buyerId === 'object'
    ? {
        id: contract.buyerId._id?.toString?.() || '',
        name: contract.buyerId.name || 'Buyer',
        email: contract.buyerId.email || '',
        profilePhoto: contract.buyerId.profilePhoto || '',
      }
    : { id: contract?.buyerId?.toString?.() || '', name: 'Buyer', email: '', profilePhoto: '' };

  const farmer = contract?.farmerId && typeof contract.farmerId === 'object'
    ? {
        id: contract.farmerId._id?.toString?.() || '',
        name: contract.farmerId.name || 'Farmer',
        email: contract.farmerId.email || '',
        profilePhoto: contract.farmerId.profilePhoto || '',
      }
    : { id: contract?.farmerId?.toString?.() || '', name: 'Farmer', email: '', profilePhoto: '' };

  return {
    id: contract?._id?.toString?.() || '',
    buyer,
    farmer,
    cropName: contract?.cropName || '',
    quantity: Number(contract?.quantity || 0),
    unit: contract?.unit || '',
    pricePerUnit: Number(contract?.pricePerUnit || 0),
    totalAmount: Number(contract?.totalAmount || 0),
    deliveryLocation: contract?.deliveryLocation || '',
    expectedDeliveryDate: contract?.expectedDeliveryDate
      ? new Date(contract.expectedDeliveryDate).toISOString()
      : null,
    notes: contract?.notes || '',
    status: contract?.status || 'pending',
    farmerDecisionNote: contract?.farmerDecisionNote || '',
    notifications: Array.isArray(contract?.notifications) ? contract.notifications : [],
    createdAt: contract?.createdAt ? new Date(contract.createdAt).toISOString() : null,
    updatedAt: contract?.updatedAt ? new Date(contract.updatedAt).toISOString() : null,
  };
}

module.exports = {
  CONTRACT_UNITS,
  CONTRACT_STATUSES,
  validateContractPayload,
  buildContractPayload,
  validateStatusTransition,
  buildStatusUpdate,
  toPublicContract,
};
