const mongoose = require('mongoose');

const SUPPORT_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const SUPPORT_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
const SUPPORT_CATEGORIES = ['technical', 'account', 'contract', 'payment', 'other'];

const supportTicketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    category: { type: String, enum: SUPPORT_CATEGORIES, required: true },
    priority: { type: String, enum: SUPPORT_PRIORITIES, default: 'medium' },
    status: { type: String, enum: SUPPORT_STATUSES, default: 'open', index: true },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    attachments: [{
      filename: { type: String, trim: true, maxlength: 255 },
      url: { type: String, trim: true, maxlength: 500 },
      uploadedAt: { type: Date, default: Date.now },
    }],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolution: { type: String, trim: true, maxlength: 1000 },
    resolvedAt: { type: Date },
    notifications: [{
      type: { type: String, enum: ['email', 'system'], default: 'system' },
      message: { type: String, required: true, trim: true, maxlength: 500 },
      sentAt: { type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
);

// Index for efficient queries
supportTicketSchema.index({ userId: 1, status: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, priority: -1, createdAt: -1 });

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

// Export both default and named shapes for backward compatibility across modules/tests.
module.exports = SupportTicket;
module.exports.SupportTicket = SupportTicket;
module.exports.SUPPORT_PRIORITIES = SUPPORT_PRIORITIES;
module.exports.SUPPORT_STATUSES = SUPPORT_STATUSES;
module.exports.SUPPORT_CATEGORIES = SUPPORT_CATEGORIES;
