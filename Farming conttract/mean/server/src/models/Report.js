const mongoose = require('mongoose');

const REPORT_TYPES = ['contracts_summary', 'marketplace_activity', 'farmer_performance', 'buyer_activity'];

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reportType: { type: String, enum: REPORT_TYPES, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    parameters: {
      startDate: { type: Date },
      endDate: { type: Date },
      status: { type: String },
      cropName: { type: String, trim: true, maxlength: 60 },
    },
    data: { type: mongoose.Schema.Types.Mixed },
    generatedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, // 7 days
  },
  { timestamps: true }
);

// Index for efficient queries
reportSchema.index({ userId: 1, reportType: 1, generatedAt: -1 });
reportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

const Report = mongoose.model('Report', reportSchema);

module.exports = {
  Report,
  REPORT_TYPES,
};