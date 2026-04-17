function normalizeSearchTerm(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toRegexFilter(value) {
  const term = normalizeSearchTerm(value);
  if (!term) return null;
  return { $regex: term, $options: 'i' };
}

function searchByCrop(crop) {
  const regex = toRegexFilter(crop);
  if (!regex) return {};
  return { crops: { $elemMatch: regex } };
}

function searchByLocation(location) {
  const regex = toRegexFilter(location);
  if (!regex) return {};
  return { region: regex };
}

function buildFarmerSearchFilter(query = {}) {
  const cropFilter = searchByCrop(query.crop);
  const locationFilter = searchByLocation(query.location);

  return {
    ...cropFilter,
    ...locationFilter,
  };
}

async function searchFarmers(query = {}) {
  const { FarmerProfile } = require('../models/FarmerProfile');
  const filter = buildFarmerSearchFilter(query);

  return FarmerProfile.find(filter)
    .populate('userId', 'name email role profilePhoto')
    .select('region crops bio createdAt updatedAt')
    .sort({ updatedAt: -1 });
}

module.exports = {
  normalizeSearchTerm,
  searchByCrop,
  searchByLocation,
  buildFarmerSearchFilter,
  searchFarmers,
};

