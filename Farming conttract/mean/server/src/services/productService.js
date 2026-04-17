const { MARKETPLACE_UNITS } = require('../models/ProductListing');

const CROP_NAME_MAX = 60;
const VARIETY_MAX = 80;
const LOCATION_MAX = 120;
const DESCRIPTION_MAX = 500;
const MAX_QUANTITY = 1000000;
const MAX_PRICE = 100000000;

function toTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toOptionalDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function toNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value.trim());
  return Number.NaN;
}

function validateListingPayload(payload) {
  const errors = [];
  const cropName = toTrimmedString(payload?.cropName);
  const variety = toTrimmedString(payload?.variety);
  const quantity = toNumber(payload?.quantity);
  const unit = toTrimmedString(payload?.unit).toLowerCase();
  const pricePerUnit = toNumber(payload?.pricePerUnit);
  const location = toTrimmedString(payload?.location);
  const description = toTrimmedString(payload?.description);
  const harvestDate = toOptionalDate(payload?.harvestDate);
  const availableUntil = toOptionalDate(payload?.availableUntil);

  if (!cropName || cropName.length < 2 || cropName.length > CROP_NAME_MAX) {
    errors.push({
      field: 'cropName',
      message: `cropName is required and must be between 2 and ${CROP_NAME_MAX} characters`,
    });
  }

  if (variety && variety.length > VARIETY_MAX) {
    errors.push({
      field: 'variety',
      message: `variety must be at most ${VARIETY_MAX} characters`,
    });
  }

  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > MAX_QUANTITY) {
    errors.push({
      field: 'quantity',
      message: `quantity must be a number between 0 and ${MAX_QUANTITY}`,
    });
  }

  if (!MARKETPLACE_UNITS.includes(unit)) {
    errors.push({
      field: 'unit',
      message: `unit must be one of: ${MARKETPLACE_UNITS.join(', ')}`,
    });
  }

  if (!Number.isFinite(pricePerUnit) || pricePerUnit <= 0 || pricePerUnit > MAX_PRICE) {
    errors.push({
      field: 'pricePerUnit',
      message: `pricePerUnit must be a number between 0 and ${MAX_PRICE}`,
    });
  }

  if (!location || location.length < 2 || location.length > LOCATION_MAX) {
    errors.push({
      field: 'location',
      message: `location is required and must be between 2 and ${LOCATION_MAX} characters`,
    });
  }

  if (description && description.length > DESCRIPTION_MAX) {
    errors.push({
      field: 'description',
      message: `description must be at most ${DESCRIPTION_MAX} characters`,
    });
  }

  if (payload?.harvestDate && !harvestDate) {
    errors.push({
      field: 'harvestDate',
      message: 'harvestDate must be a valid date',
    });
  }

  if (payload?.availableUntil && !availableUntil) {
    errors.push({
      field: 'availableUntil',
      message: 'availableUntil must be a valid date',
    });
  }

  if (harvestDate && availableUntil && harvestDate.getTime() > availableUntil.getTime()) {
    errors.push({
      field: 'availableUntil',
      message: 'availableUntil must be on or after harvestDate',
    });
  }

  return errors;
}

function buildProductPayload(payload, farmerId) {
  const normalized = {
    farmerId,
    cropName: toTrimmedString(payload?.cropName),
    variety: toTrimmedString(payload?.variety),
    quantity: toNumber(payload?.quantity),
    unit: toTrimmedString(payload?.unit).toLowerCase(),
    pricePerUnit: toNumber(payload?.pricePerUnit),
    location: toTrimmedString(payload?.location),
    description: toTrimmedString(payload?.description),
    harvestDate: toOptionalDate(payload?.harvestDate) || undefined,
    availableUntil: toOptionalDate(payload?.availableUntil) || undefined,
    isActive: true,
  };

  if (!normalized.variety) delete normalized.variety;
  if (!normalized.description) delete normalized.description;

  return normalized;
}

function toPublicListing(listing) {
  const farmerId = listing?.farmerId;
  const farmer = typeof farmerId === 'object' && farmerId
    ? {
        id: farmerId._id?.toString?.() || '',
        name: farmerId.name || 'Farmer',
        profilePhoto: farmerId.profilePhoto || '',
      }
    : { id: listing?.farmerId?.toString?.() || '', name: 'Farmer', profilePhoto: '' };

  return {
    id: listing?._id?.toString?.() || '',
    cropName: listing?.cropName || '',
    variety: listing?.variety || '',
    quantity: Number(listing?.quantity || 0),
    unit: listing?.unit || '',
    pricePerUnit: Number(listing?.pricePerUnit || 0),
    location: listing?.location || '',
    harvestDate: listing?.harvestDate ? new Date(listing.harvestDate).toISOString() : null,
    availableUntil: listing?.availableUntil ? new Date(listing.availableUntil).toISOString() : null,
    description: listing?.description || '',
    isActive: Boolean(listing?.isActive),
    farmer,
    createdAt: listing?.createdAt ? new Date(listing.createdAt).toISOString() : null,
  };
}

module.exports = {
  MARKETPLACE_UNITS,
  validateListingPayload,
  buildProductPayload,
  toPublicListing,
};
