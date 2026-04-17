const test = require('node:test');
const assert = require('node:assert/strict');

const { searchFarmerProfiles, fetchProfile } = require('../src/repositories/profileRepository');

test('searchFarmerProfiles calls FarmerProfile.find with correct filter', async () => {
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
    const result = await searchFarmerProfiles({ region: 'coimbatore' });
    assert.equal(capturedFilter.region, 'coimbatore');
    assert.equal(result, mockProfiles);
  } finally {
    require('../src/models/FarmerProfile').FarmerProfile.find = originalFind;
  }
});

test('fetchProfile calls FarmerProfile.findOne with correct userId', async () => {
  const mockProfile = {
    userId: { _id: 'user1', name: 'John', email: 'john@test.com', role: 'farmer' },
    region: 'Coimbatore',
    crops: ['rice', 'wheat'],
    bio: 'Farm bio',
  };

  const originalFindOne = require('../src/models/FarmerProfile').FarmerProfile.findOne;
  let capturedUserId;

  require('../src/models/FarmerProfile').FarmerProfile.findOne = function(filter) {
    capturedUserId = filter.userId;
    return {
      populate: () => ({
        select: () => Promise.resolve(mockProfile)
      })
    };
  };

  try {
    const result = await fetchProfile('user1');
    assert.equal(capturedUserId, 'user1');
    assert.equal(result, mockProfile);
  } finally {
    require('../src/models/FarmerProfile').FarmerProfile.findOne = originalFindOne;
  }
});