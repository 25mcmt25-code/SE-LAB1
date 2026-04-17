const supportTicketModule = require('../models/SupportTicket');

const SupportTicket = supportTicketModule.SupportTicket || supportTicketModule;
const SUPPORT_PRIORITIES = supportTicketModule.SUPPORT_PRIORITIES || ['low', 'medium', 'high', 'urgent'];
const SUPPORT_STATUSES = supportTicketModule.SUPPORT_STATUSES || ['open', 'in_progress', 'resolved', 'closed'];
const SUPPORT_CATEGORIES = supportTicketModule.SUPPORT_CATEGORIES || ['technical', 'account', 'contract', 'payment', 'other'];

const SUBJECT_MAX = 200;
const DESCRIPTION_MAX = 1000;

function toTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeTicketInput(inputOrUserId, maybePayload) {
  if (typeof inputOrUserId === 'object' && inputOrUserId !== null) {
    return { ...inputOrUserId };
  }

  return {
    ...(maybePayload || {}),
    userId: inputOrUserId,
  };
}

function validateSupportTicketPayload(payload) {
  const errors = [];
  const subject = toTrimmedString(payload?.subject);
  const category = toTrimmedString(payload?.category).toLowerCase();
  const description = toTrimmedString(payload?.description);
  const priority = toTrimmedString(payload?.priority).toLowerCase() || 'medium';

  if (!subject || subject.length < 5 || subject.length > SUBJECT_MAX) {
    errors.push({ field: 'subject', message: `Subject must be between 5 and ${SUBJECT_MAX} characters` });
  }

  if (!SUPPORT_CATEGORIES.includes(category)) {
    errors.push({ field: 'category', message: 'Invalid support category' });
  }

  if (!SUPPORT_PRIORITIES.includes(priority)) {
    errors.push({ field: 'priority', message: 'Invalid priority level' });
  }

  if (!description || description.length < 10 || description.length > DESCRIPTION_MAX) {
    errors.push({ field: 'description', message: `Description must be between 10 and ${DESCRIPTION_MAX} characters` });
  }

  return errors;
}

class SupportService {
  async createTicket(inputOrUserId, maybePayload) {
    const ticketData = normalizeTicketInput(inputOrUserId, maybePayload);
    const errors = validateSupportTicketPayload(ticketData);

    const categoryError = errors.find((error) => error.field === 'category');
    if (categoryError) {
      throw new Error('Invalid support category');
    }

    const priorityError = errors.find((error) => error.field === 'priority');
    if (priorityError) {
      throw new Error('Invalid priority level');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.map((error) => error.message).join(', ')}`);
    }

    const payload = {
      userId: ticketData.userId,
      subject: toTrimmedString(ticketData.subject),
      category: toTrimmedString(ticketData.category).toLowerCase(),
      priority: toTrimmedString(ticketData.priority).toLowerCase() || 'medium',
      description: toTrimmedString(ticketData.description),
      status: 'open',
      notifications: [],
    };

    return SupportTicket.create(payload);
  }

  async notifyUser(ticketId, message) {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      throw new Error('Support ticket not found');
    }

    if (!Array.isArray(ticket.notifications)) {
      ticket.notifications = [];
    }

    ticket.notifications.push({
      message: toTrimmedString(message),
      createdAt: new Date(),
    });

    await ticket.save();
    return ticket;
  }

  async getUserTickets(userId, status = null) {
    const query = { userId };
    if (status) query.status = status;

    const result = SupportTicket.find(query);
    if (typeof result.sort === 'function') {
      return result.sort({ createdAt: -1 });
    }

    return result;
  }

  async getTicketById(ticketId) {
    return SupportTicket.findOne({ _id: ticketId });
  }

  async updateTicketStatus(ticketId, newStatus, resolution = '') {
    if (!SUPPORT_STATUSES.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      throw new Error('Support ticket not found');
    }

    ticket.status = newStatus;
    if (newStatus === 'resolved' && resolution) {
      ticket.resolution = toTrimmedString(resolution);
      ticket.resolvedAt = new Date();
    }

    await ticket.save();
    return ticket;
  }
}

const defaultSupportService = new SupportService();

async function createTicket(userId, payload) {
  return defaultSupportService.createTicket(userId, payload);
}

async function notifyUser(ticketId, message) {
  return defaultSupportService.notifyUser(ticketId, message);
}

async function getUserTickets(userId, status) {
  return defaultSupportService.getUserTickets(userId, status);
}

async function getTicketById(ticketId) {
  return defaultSupportService.getTicketById(ticketId);
}

async function updateTicketStatus(ticketId, newStatus, resolution) {
  return defaultSupportService.updateTicketStatus(ticketId, newStatus, resolution);
}

module.exports = SupportService;
module.exports.SupportService = SupportService;
module.exports.validateSupportTicketPayload = validateSupportTicketPayload;
module.exports.createTicket = createTicket;
module.exports.notifyUser = notifyUser;
module.exports.getUserTickets = getUserTickets;
module.exports.getTicketById = getTicketById;
module.exports.updateTicketStatus = updateTicketStatus;
module.exports.SUPPORT_PRIORITIES = SUPPORT_PRIORITIES;
module.exports.SUPPORT_STATUSES = SUPPORT_STATUSES;
module.exports.SUPPORT_CATEGORIES = SUPPORT_CATEGORIES;