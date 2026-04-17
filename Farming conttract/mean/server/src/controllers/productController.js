const {
  validateListingPayload,
  buildProductPayload,
  toPublicListing,
} = require('../services/productService');
const repository = require('../repositories/productRepository');

function createProductController(dependencies = {}) {
  const saveProduct = dependencies.saveProduct || repository.saveProduct;
  const fetchAllActiveListings = dependencies.fetchAllActiveListings || repository.fetchAllActiveListings;

  return {
    async submitProduct(req, res, next) {
      try {
        if (req.user?.role !== 'farmer') {
          return res.status(403).json({ message: 'Only farmers can submit product listings' });
        }

        const errors = validateListingPayload(req.body);
        if (errors.length) {
          return res.status(400).json({ message: 'Validation error', errors });
        }

        const payload = buildProductPayload(req.body, req.user.userId);
        const created = await saveProduct(payload);
        const listing = toPublicListing(created);

        return res.status(201).json({
          message: 'Product listing created',
          listing,
        });
      } catch (err) {
        return next(err);
      }
    },

    async getMarketplaceListings(req, res, next) {
      try {
        const listings = await fetchAllActiveListings();
        return res.json({
          listings: listings.map((listing) => toPublicListing(listing)),
        });
      } catch (err) {
        return next(err);
      }
    },
  };
}

const defaultController = createProductController();

module.exports = {
  createProductController,
  submitProduct: defaultController.submitProduct,
  getMarketplaceListings: defaultController.getMarketplaceListings,
};
