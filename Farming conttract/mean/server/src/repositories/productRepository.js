const { ProductListing } = require('../models/ProductListing');

async function saveProduct(payload) {
  return ProductListing.create(payload);
}

async function fetchAllActiveListings() {
  return ProductListing.find({ isActive: true })
    .populate('farmerId', 'name profilePhoto')
    .sort({ createdAt: -1 });
}

module.exports = {
  saveProduct,
  fetchAllActiveListings,
};
