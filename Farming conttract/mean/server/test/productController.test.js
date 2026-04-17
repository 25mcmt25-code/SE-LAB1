const test = require('node:test');
const assert = require('node:assert/strict');

const { createProductController } = require('../src/controllers/productController');

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

test('submitProduct rejects non-farmer users', async () => {
  const controller = createProductController({
    saveProduct: async () => {
      throw new Error('saveProduct should not be called');
    },
  });
  const req = {
    user: { userId: 'buyer-1', role: 'buyer' },
    body: {},
  };
  const res = createResponseRecorder();
  let nextCalled = false;

  await controller.submitProduct(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, 'Only farmers can submit product listings');
});

test('submitProduct returns validation errors for invalid payload', async () => {
  const controller = createProductController({
    saveProduct: async () => {
      throw new Error('saveProduct should not be called');
    },
  });
  const req = {
    user: { userId: 'farmer-1', role: 'farmer' },
    body: { cropName: 'a' },
  };
  const res = createResponseRecorder();

  await controller.submitProduct(req, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, 'Validation error');
  assert.ok(Array.isArray(res.body.errors));
  assert.ok(res.body.errors.length > 0);
});

test('submitProduct saves listing and returns created payload', async () => {
  let capturedPayload = null;
  const controller = createProductController({
    saveProduct: async (payload) => {
      capturedPayload = payload;
      return {
        _id: { toString: () => 'listing-1' },
        ...payload,
        createdAt: new Date('2026-04-07T00:00:00.000Z'),
      };
    },
  });
  const req = {
    user: { userId: 'farmer-1', role: 'farmer' },
    body: {
      cropName: 'Paddy',
      quantity: 30,
      unit: 'kg',
      pricePerUnit: 23,
      location: 'Thanjavur',
      description: 'Short grain lot',
    },
  };
  const res = createResponseRecorder();

  await controller.submitProduct(req, res, () => {});

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.message, 'Product listing created');
  assert.equal(res.body.listing.cropName, 'Paddy');
  assert.equal(capturedPayload.farmerId, 'farmer-1');
  assert.equal(capturedPayload.unit, 'kg');
});

test('getMarketplaceListings returns mapped active listings', async () => {
  const controller = createProductController({
    fetchAllActiveListings: async () => [
      {
        _id: { toString: () => 'listing-1' },
        cropName: 'Turmeric',
        variety: 'Salem',
        quantity: 20,
        unit: 'kg',
        pricePerUnit: 120,
        location: 'Erode',
        description: 'Dry lot',
        isActive: true,
        createdAt: new Date('2026-04-07T00:00:00.000Z'),
        farmerId: {
          _id: { toString: () => 'farmer-1' },
          name: 'Arun Kumar',
          profilePhoto: '',
        },
      },
    ],
  });
  const res = createResponseRecorder();

  await controller.getMarketplaceListings({}, res, () => {});

  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body.listings));
  assert.equal(res.body.listings.length, 1);
  assert.equal(res.body.listings[0].farmer.name, 'Arun Kumar');
  assert.equal(res.body.listings[0].cropName, 'Turmeric');
});
