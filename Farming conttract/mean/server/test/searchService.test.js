const test = require('node:test');
const assert = require('node:assert/strict');

const {
  searchByCrop,
  searchByLocation,
  buildFarmerSearchFilter,
  searchFarmers,
} = require('../src/services/searchService');

test('searchByCrop returns crop regex filter', () => {
  const filter = searchByCrop('rice');
  assert.ok(filter.crops);
  assert.ok(filter.crops.$elemMatch);
  assert.equal(filter.crops.$elemMatch.$options, 'i');
});

test('searchByLocation returns location regex filter', () => {
  const filter = searchByLocation('coimbatore');
  assert.ok(filter.region);
  assert.equal(filter.region.$options, 'i');
});

test('buildFarmerSearchFilter merges crop and location filters', () => {
  const filter = buildFarmerSearchFilter({ crop: 'maize', location: 'mysuru' });
  assert.ok(filter.crops);
  assert.ok(filter.region);
  assert.equal(filter.crops.$elemMatch.$options, 'i');
  assert.equal(filter.region.$options, 'i');
});

test('searchFarmers calls FarmerProfile.find with correct filter', async () => {
  // Mock the FarmerProfile model
  const mockProfiles = [
    {
      userId: { _id: 'user1', name: 'John', email: 'john@test.com', role: 'farmer' },
      region: 'Coimbatore',
      crops: ['rice', 'wheat'],
      bio: 'Farm bio',
    }
  ];

  const originalFind = require('../src/models/FarmerProfile').FarmerProfile.find;
  let capturedFilter;

  require('../src/models/FarmerProfile').FarmerProfile.find = function(filter) {
    capturedFilter = filter;
    return {
      populate: () => ({
        select: () => ({
          sort: () => Promise.resolve(mockProfiles)
        })
      })
    };
  };

  try {
    const result = await searchFarmers({ crop: 'rice', location: 'coimbatore' });
    assert.ok(capturedFilter.crops);
    assert.ok(capturedFilter.region);
    assert.equal(result, mockProfiles);
  } finally {
    require('../src/models/FarmerProfile').FarmerProfile.find = originalFind;
  }
});

