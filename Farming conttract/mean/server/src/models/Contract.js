const mongoose = require('mongoose');

const CONTRACT_UNITS = ['kg', 'quintal', 'tonne', 'bag'];
const CONTRACT_STATUSES = ['pending', 'accepted', 'rejected', 'cancelled', 'completed'];

const contractNotificationSchema = new mongoose.Schema(
  {
    recipientRole: { type: String, enum: ['buyer', 'farmer'], required: true },
    message: { type: String, required: true, trim: true, maxlength: 240 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const contractSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cropName: { type: String, required: true, trim: true, maxlength: 60 },
    quantity: { type: Number, required: true, min: 0.01, max: 1000000 },
    unit: { type: String, enum: CONTRACT_UNITS, required: true },
    pricePerUnit: { type: Number, required: true, min: 0.01, max: 100000000 },
    totalAmount: { type: Number, required: true, min: 0.01, max: 1000000000 },
    deliveryLocation: { type: String, required: true, trim: true, maxlength: 120 },
    expectedDeliveryDate: { type: Date },
    notes: { type: String, trim: true, maxlength: 500 },
    status: { type: String, enum: CONTRACT_STATUSES, default: 'pending', index: true },
    farmerDecisionNote: { type: String, trim: true, maxlength: 300 },
    notifications: { type: [contractNotificationSchema], default: [] },
  },
  { timestamps: true }
);

const Contract = mongoose.model('Contract', contractSchema);

module.exports = {
  Contract,
  CONTRACT_UNITS,
  CONTRACT_STATUSES,
};

