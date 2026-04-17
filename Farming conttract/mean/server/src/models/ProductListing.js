const mongoose = require('mongoose');

const MARKETPLACE_UNITS = ['kg', 'quintal', 'tonne', 'bag'];

const productListingSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cropName: { type: String, required: true, trim: true, maxlength: 60 },
    variety: { type: String, trim: true, maxlength: 80 },
    quantity: { type: Number, required: true, min: 0.01, max: 1000000 },
    unit: { type: String, enum: MARKETPLACE_UNITS, required: true },
    pricePerUnit: { type: Number, required: true, min: 0.01, max: 100000000 },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    harvestDate: { type: Date },
    availableUntil: { type: Date },
    description: { type: String, trim: true, maxlength: 500 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

const ProductListing = mongoose.model('ProductListing', productListingSchema);

module.exports = { ProductListing, MARKETPLACE_UNITS };
