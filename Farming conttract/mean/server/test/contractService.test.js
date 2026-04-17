const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validateContractPayload,
  buildContractPayload,
  validateStatusTransition,
  toPublicContract,
} = require('../src/services/contractService');

test('validateContractPayload returns errors for missing required fields', () => {
  const errors = validateContractPayload({});
  const fields = errors.map((entry) => entry.field);

  assert.ok(fields.includes('cropName'));
  assert.ok(fields.includes('quantity'));
  assert.ok(fields.includes('unit'));
  assert.ok(fields.includes('pricePerUnit'));
  assert.ok(fields.includes('deliveryLocation'));
});

test('validateContractPayload accepts valid payload', () => {
  const errors = validateContractPayload({
    cropName: 'Paddy',
    quantity: 500,
    unit: 'kg',
    pricePerUnit: 28,
    deliveryLocation: 'Coimbatore',
    expectedDeliveryDate: '2026-04-30',
  });

  assert.equal(errors.length, 0);
});

test('buildContractPayload normalizes values and computes total', () => {
  const payload = buildContractPayload(
    {
      cropName: '  Maize  ',
      quantity: '100',
      unit: 'Quintal',
      pricePerUnit: '2100.50',
      deliveryLocation: '  Mysuru Yard ',
      notes: '  Dry lot  ',
    },
    'buyer-1',
    'farmer-1'
  );

  assert.equal(payload.cropName, 'Maize');
  assert.equal(payload.quantity, 100);
  assert.equal(payload.unit, 'quintal');
  assert.equal(payload.pricePerUnit, 2100.5);
  assert.equal(payload.totalAmount, 210050);
  assert.equal(payload.deliveryLocation, 'Mysuru Yard');
  assert.equal(payload.notes, 'Dry lot');
  assert.equal(payload.notifications.length, 1);
});

test('validateStatusTransition enforces actor rules', () => {
  const farmerError = validateStatusTransition('pending', 'cancelled', 'farmer');
  const buyerError = validateStatusTransition('pending', 'accepted', 'buyer');
  const validTransition = validateStatusTransition('pending', 'accepted', 'farmer');

  assert.equal(farmerError, 'Farmers can only accept or reject pending contracts');
  assert.equal(buyerError, 'Buyers can only cancel pending contracts');
  assert.equal(validTransition, '');
});

test('toPublicContract maps populated actor details', () => {
  const mapped = toPublicContract({
    _id: { toString: () => 'contract-1' },
    buyerId: {
      _id: { toString: () => 'buyer-1' },
      name: 'Ravi Buyer',
      email: 'ravi@example.com',
      profilePhoto: '',
    },
    farmerId: {
      _id: { toString: () => 'farmer-1' },
      name: 'Arun Farmer',
      email: 'arun@example.com',
      profilePhoto: '',
    },
    cropName: 'Paddy',
    quantity: 200,
    unit: 'kg',
    pricePerUnit: 30,
    totalAmount: 6000,
    deliveryLocation: 'Erode',
    status: 'pending',
    notifications: [],
    createdAt: new Date('2026-04-07T00:00:00.000Z'),
    updatedAt: new Date('2026-04-07T00:00:00.000Z'),
  });

  assert.equal(mapped.id, 'contract-1');
  assert.equal(mapped.buyer.name, 'Ravi Buyer');
  assert.equal(mapped.farmer.name, 'Arun Farmer');
  assert.equal(mapped.totalAmount, 6000);
});

