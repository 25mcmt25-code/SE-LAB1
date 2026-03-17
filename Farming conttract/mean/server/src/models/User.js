const mongoose = require('mongoose');

const USER_ROLES = ['farmer', 'buyer'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: USER_ROLES, required: true },
    desiredCrops: [{ type: String, trim: true, maxlength: 60 }],
    savedCard: {
      cardHolderName: { type: String, trim: true, maxlength: 120 },
      cardBrand: { type: String, trim: true, maxlength: 30 },
      last4: { type: String, trim: true, maxlength: 4 },
      expiryMonth: { type: String, trim: true, maxlength: 2 },
      expiryYear: { type: String, trim: true, maxlength: 4 },
    },
    resetPasswordTokenHash: { type: String },
    resetPasswordExpiresAt: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

module.exports = { User, USER_ROLES };
