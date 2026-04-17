const test = require('node:test');
const assert = require('node:assert/strict');

const { createContractController } = require('../src/controllers/contractController');

function createResponseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('submitContract rejects users outside buyer/farmer roles', async () => {
  const controller = createContractController();
  const req = {
    user: { userId: 'admin-1', role: 'admin' },
    body: {},
  };
  const res = createResponseRecorder();

  await controller.submitContract(req, res, () => {});

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, 'Only buyers or farmers can create contract requests');
});

test('submitContract returns validation errors for invalid payload', async () => {
  const controller = createContractController({
    findFarmerById: async () => ({ _id: 'farmer-1' }),
  });
  const req = {
    user: { userId: 'buyer-1', role: 'buyer' },
    body: { farmerId: 'farmer-1', cropName: 'a' },
  };
  const res = createResponseRecorder();

  await controller.submitContract(req, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, 'Validation error');
  assert.ok(Array.isArray(res.body.errors));
  assert.ok(res.body.errors.length > 0);
});

test('submitContract creates contract and returns response payload', async () => {
  let createdPayload = null;
  const controller = createContractController({
    findFarmerById: async () => ({ _id: 'farmer-1' }),
    findBuyerById: async () => ({ _id: 'buyer-1' }),
    createContract: async (payload) => {
      createdPayload = payload;
      return {
        _id: 'contract-1',
        ...payload,
      };
    },
    getContractById: async () => ({
      _id: { toString: () => 'contract-1' },
      buyerId: { _id: { toString: () => 'buyer-1' }, name: 'Buyer', email: '', profilePhoto: '' },
      farmerId: { _id: { toString: () => 'farmer-1' }, name: 'Farmer', email: '', profilePhoto: '' },
      cropName: 'Paddy',
      quantity: 100,
      unit: 'kg',
      pricePerUnit: 28,
      totalAmount: 2800,
      deliveryLocation: 'Coimbatore',
      status: 'pending',
      notifications: [],
      createdAt: new Date('2026-04-07T00:00:00.000Z'),
      updatedAt: new Date('2026-04-07T00:00:00.000Z'),
    }),
  });
  const req = {
    user: { userId: 'buyer-1', role: 'buyer' },
    body: {
      farmerId: 'farmer-1',
      cropName: 'Paddy',
      quantity: 100,
      unit: 'kg',
      pricePerUnit: 28,
      deliveryLocation: 'Coimbatore',
    },
  };
  const res = createResponseRecorder();

  await controller.submitContract(req, res, () => {});

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.message, 'Contract request created');
  assert.equal(createdPayload.buyerId, 'buyer-1');
  assert.equal(createdPayload.farmerId, 'farmer-1');
});

test('submitContract allows farmer to initiate contract for a buyer', async () => {
  let createdPayload = null;
  const controller = createContractController({
    findFarmerById: async () => ({ _id: 'farmer-1' }),
    findBuyerById: async () => ({ _id: 'buyer-1' }),
    createContract: async (payload) => {
      createdPayload = payload;
      return { _id: 'contract-2', ...payload };
    },
    getContractById: async () => ({
      _id: { toString: () => 'contract-2' },
      buyerId: { _id: { toString: () => 'buyer-1' }, name: 'Buyer', email: '', profilePhoto: '' },
      farmerId: { _id: { toString: () => 'farmer-1' }, name: 'Farmer', email: '', profilePhoto: '' },
      cropName: 'Groundnut',
      quantity: 40,
      unit: 'kg',
      pricePerUnit: 55,
      totalAmount: 2200,
      deliveryLocation: 'Salem',
      status: 'pending',
      notifications: [],
      createdAt: new Date('2026-04-08T00:00:00.000Z'),
      updatedAt: new Date('2026-04-08T00:00:00.000Z'),
    }),
  });

  const req = {
    user: { userId: 'farmer-1', role: 'farmer' },
    body: {
      buyerId: 'buyer-1',
      cropName: 'Groundnut',
      quantity: 40,
      unit: 'kg',
      pricePerUnit: 55,
      deliveryLocation: 'Salem',
    },
  };
  const res = createResponseRecorder();

  await controller.submitContract(req, res, () => {});

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.message, 'Contract request created');
  assert.equal(createdPayload.buyerId, 'buyer-1');
  assert.equal(createdPayload.farmerId, 'farmer-1');
});

test('getMyContracts returns mapped list', async () => {
  const controller = createContractController({
    getContractsByActor: async () => [
      {
        _id: { toString: () => 'contract-1' },
        buyerId: { _id: { toString: () => 'buyer-1' }, name: 'Buyer', email: '', profilePhoto: '' },
        farmerId: { _id: { toString: () => 'farmer-1' }, name: 'Farmer', email: '', profilePhoto: '' },
        cropName: 'Maize',
        quantity: 50,
        unit: 'kg',
        pricePerUnit: 20,
        totalAmount: 1000,
        deliveryLocation: 'Mysuru',
        status: 'pending',
        notifications: [],
      },
    ],
  });
  const req = { user: { userId: 'buyer-1', role: 'buyer' } };
  const res = createResponseRecorder();

  await controller.getMyContracts(req, res, () => {});

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.contracts.length, 1);
  assert.equal(res.body.contracts[0].cropName, 'Maize');
});
