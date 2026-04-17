const express = require('express');

const { requireAuth } = require('../middleware/auth');
const { submitProduct, getMarketplaceListings } = require('../controllers/productController');

const router = express.Router();

router.post('/listings', requireAuth, submitProduct);
router.get('/listings', requireAuth, getMarketplaceListings);

module.exports = router;
