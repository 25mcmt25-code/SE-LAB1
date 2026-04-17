const supportTicketModule = require('../models/SupportTicket');
const SupportService = require('../services/supportService');

const SupportTicket = supportTicketModule.SupportTicket || supportTicketModule;

function getCurrentUserId(req) {
  return req?.user?.userId || req?.user?.id || null;
}

function toStringId(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value.toString === 'function') return value.toString();
  return '';
}

function createSupportController(dependencies = {}) {
  const supportService = dependencies.supportService || new SupportService();
  const findTickets = dependencies.findTickets || ((query) => SupportTicket.find(query));
  const findTicketById = dependencies.findTicketById || ((ticketId) => SupportTicket.findOne({ _id: ticketId }));

  return {
    async createSupportTicket(req, res, next) {
      try {
        const ticket = await supportService.createTicket({
          ...req.body,
          userId: getCurrentUserId(req),
        });

        return res.status(201).json({
          message: 'Support ticket created successfully',
          ticket,
        });
      } catch (err) {
        if (typeof err?.message === 'string' && (
          err.message.includes('Validation failed')
          || err.message.includes('Invalid support category')
          || err.message.includes('Invalid priority level')
        )) {
          return res.status(400).json({ message: err.message });
        }

        return next(err);
      }
    },

    async getUserSupportTickets(req, res, next) {
      try {
        const userId = getCurrentUserId(req);
        const { status } = req.query || {};
        const query = { userId };
        if (status) query.status = status;

        const queryOrTickets = findTickets(query);
        const tickets = queryOrTickets && typeof queryOrTickets.sort === 'function'
          ? await queryOrTickets.sort({ createdAt: -1 })
          : await queryOrTickets;

        return res.json({ tickets: tickets || [] });
      } catch (err) {
        return next(err);
      }
    },

    async getSupportTicket(req, res, next) {
      try {
        const userId = getCurrentUserId(req);
        const ticket = await findTicketById(req.params.ticketId);

        if (!ticket) {
          return res.status(404).json({ message: 'Support ticket not found' });
        }

        const ticketOwner = toStringId(ticket.userId);
        if (ticketOwner && ticketOwner !== toStringId(userId)) {
          return res.status(403).json({ message: 'Access denied' });
        }

        return res.json({ ticket });
      } catch (err) {
        return next(err);
      }
    },
  };
}

const defaultController = createSupportController();

module.exports = {
  ...defaultController,
  createSupportController,
};