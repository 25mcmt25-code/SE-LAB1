const mongoose = require('mongoose');

const farmerProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    region: { type: String, required: true, trim: true, maxlength: 120 },
    crops: [{ type: String, trim: true, maxlength: 60 }],
    bio: { type: String, trim: true, maxlength: 500 },
    upiId: { type: String, trim: true, maxlength: 80 },
    bank: {
      accountHolderName: { type: String, trim: true, maxlength: 120 },
      accountNumber: { type: String, trim: true, maxlength: 30 },
      ifsc: { type: String, trim: true, maxlength: 20 },
      bankName: { type: String, trim: true, maxlength: 120 },
    },
  },
  { timestamps: true }
);

const FarmerProfile = mongoose.model('FarmerProfile', farmerProfileSchema);

module.exports = { FarmerProfile };
