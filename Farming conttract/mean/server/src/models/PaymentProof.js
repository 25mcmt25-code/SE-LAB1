const mongoose = require('mongoose');

const PAYMENT_PROOF_STATUSES = ['submitted', 'verified', 'rejected'];
const PAYMENT_METHODS = ['upi', 'bank_transfer', 'card', 'cash', 'other'];

const paymentProofSchema = new mongoose.Schema(
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
    amount: {
      type: Number,
      required: true,
      min: 0.01,
      max: 100000000,
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 10,
      default: 'INR',
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      required: true,
    },
    referenceId: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    screenshot: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000000,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: PAYMENT_PROOF_STATUSES,
      default: 'submitted',
      index: true,
    },
    farmerRemarks: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const PaymentProof = mongoose.model('PaymentProof', paymentProofSchema);

module.exports = {
  PaymentProof,
  PAYMENT_METHODS,
  PAYMENT_PROOF_STATUSES,
};

