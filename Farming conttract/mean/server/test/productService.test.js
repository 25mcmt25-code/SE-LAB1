const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validateListingPayload,
  buildProductPayload,
  toPublicListing,
} = require('../src/services/productService');

test('validateListingPayload returns errors for missing required fields', () => {
  const errors = validateListingPayload({});
  const fields = errors.map((entry) => entry.field);

  assert.ok(fields.includes('cropName'));
  assert.ok(fields.includes('quantity'));
  assert.ok(fields.includes('unit'));
  assert.ok(fields.includes('pricePerUnit'));
  assert.ok(fields.includes('location'));
});

test('validateListingPayload accepts a valid listing', () => {
  const errors = validateListingPayload({
    cropName: 'Paddy',
    variety: 'Ponni',
    quantity: 50,
    unit: 'kg',
    pricePerUnit: 24,
    location: 'Coimbatore',
    harvestDate: '2026-04-06',
    availableUntil: '2026-04-20',
    description: 'Low moisture lot.',
  });

  assert.equal(errors.length, 0);
});

test('buildProductPayload normalizes numeric and text values', () => {
  const payload = buildProductPayload(
    {
      cropName: '  Maize  ',
      variety: '  Sweet Corn ',
      quantity: '42.5',
      unit: 'Quintal',
      pricePerUnit: '1999.5',
      location: '  Mysuru ',
      description: '  Grade A produce  ',
    },
    '507f1f77bcf86cd799439011'
  );

  assert.equal(payload.cropName, 'Maize');
  assert.equal(payload.variety, 'Sweet Corn');
  assert.equal(payload.quantity, 42.5);
  assert.equal(payload.unit, 'quintal');
  assert.equal(payload.pricePerUnit, 1999.5);
  assert.equal(payload.location, 'Mysuru');
  assert.equal(payload.description, 'Grade A produce');
  assert.equal(payload.farmerId, '507f1f77bcf86cd799439011');
  assert.equal(payload.isActive, true);
});

test('toPublicListing maps listing with populated farmer details', () => {
  const mapped = toPublicListing({
    _id: { toString: () => 'listing-1' },
    cropName: 'Turmeric',
    variety: 'Salem',
    quantity: 20,
    unit: 'kg',
    pricePerUnit: 140,
    location: 'Erode',
    isActive: true,
    createdAt: new Date('2026-04-07T00:00:00.000Z'),
    farmerId: {
      _id: { toString: () => 'farmer-1' },
      name: 'Arun Kumar',
      profilePhoto: 'photo-data',
    },
  });

  assert.equal(mapped.id, 'listing-1');
  assert.equal(mapped.farmer.id, 'farmer-1');
  assert.equal(mapped.farmer.name, 'Arun Kumar');
  assert.equal(mapped.cropName, 'Turmeric');
  assert.equal(mapped.quantity, 20);
  assert.equal(mapped.isActive, true);
});
