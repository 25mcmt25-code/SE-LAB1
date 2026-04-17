const { FarmerProfile } = require('../models/FarmerProfile');

async function searchFarmerProfiles(filter = {}) {
  return FarmerProfile.find(filter)
    .populate('userId', 'name email role profilePhoto')
    .select('region crops bio createdAt updatedAt')
    .sort({ updatedAt: -1 });
}

async function fetchProfile(farmerUserId) {
  return FarmerProfile.findOne({ userId: farmerUserId })
    .populate('userId', 'name email role profilePhoto')
    .select('region crops bio createdAt updatedAt');
}

module.exports = {
  searchFarmerProfiles,
  fetchProfile,
};

