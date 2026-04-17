const test = require('node:test');
const assert = require('node:assert/strict');
const sinon = require('sinon');

const { createSupportTicket, getUserSupportTickets, getSupportTicket } = require('../src/controllers/supportController');
const SupportService = require('../src/services/supportService');
const SupportTicket = require('../src/models/SupportTicket');

test('createSupportTicket creates a support ticket successfully', async () => {
  const req = {
    user: { id: 'user123' },
    body: {
      subject: 'Test Issue',
      category: 'technical',
      priority: 'high',
      description: 'This is a test issue'
    }
  };
  const res = {
    status: sinon.stub().returnsThis(),
    json: sinon.stub().returnsThis()
  };
  const next = sinon.stub();

  const mockTicket = { id: 'ticket123', ...req.body, status: 'open' };
  const serviceStub = sinon.stub(SupportService.prototype, 'createTicket').resolves(mockTicket);

  await createSupportTicket(req, res, next);

  assert(res.status.calledWith(201));
  assert(res.json.calledWith({
    message: 'Support ticket created successfully',
    ticket: mockTicket
  }));

  serviceStub.restore();
});

test('createSupportTicket handles service errors', async () => {
  const req = {
    user: { id: 'user123' },
    body: {
      subject: 'Test Issue',
      category: 'technical',
      priority: 'high',
      description: 'This is a test issue'
    }
  };
  const res = {
    status: sinon.stub().returnsThis(),
    json: sinon.stub().returnsThis()
  };
  const next = sinon.stub();

  const error = new Error('Service error');
  const serviceStub = sinon.stub(SupportService.prototype, 'createTicket').rejects(error);

  await createSupportTicket(req, res, next);

  assert(next.calledWith(error));

  serviceStub.restore();
});

test('getUserSupportTickets returns user support tickets', async () => {
  const req = { user: { id: 'user123' } };
  const res = {
    json: sinon.stub().returnsThis()
  };
  const next = sinon.stub();

  const mockTickets = [
    { id: 'ticket1', subject: 'Issue 1', status: 'open' },
    { id: 'ticket2', subject: 'Issue 2', status: 'resolved' }
  ];

  const ticketStub = sinon.stub(SupportTicket, 'find').resolves(mockTickets);

  await getUserSupportTickets(req, res, next);

  assert(res.json.calledWith({ tickets: mockTickets }));

  ticketStub.restore();
});

test('getUserSupportTickets handles database errors', async () => {
  const req = { user: { id: 'user123' } };
  const res = {
    json: sinon.stub().returnsThis()
  };
  const next = sinon.stub();

  const error = new Error('Database error');
  const ticketStub = sinon.stub(SupportTicket, 'find').rejects(error);

  await getUserSupportTickets(req, res, next);

  assert(next.calledWith(error));

  ticketStub.restore();
});

test('getSupportTicket returns a specific support ticket', async () => {
  const req = {
    user: { id: 'user123' },
    params: { ticketId: 'ticket123' }
  };
  const res = {
    json: sinon.stub().returnsThis()
  };
  const next = sinon.stub();

  const mockTicket = { id: 'ticket123', subject: 'Test Issue', userId: 'user123' };
  const findStub = sinon.stub(SupportTicket, 'findOne').resolves(mockTicket);

  await getSupportTicket(req, res, next);

  assert(res.json.calledWith({ ticket: mockTicket }));

  findStub.restore();
});

test('getSupportTicket returns 404 for non-existent ticket', async () => {
  const req = {
    user: { id: 'user123' },
    params: { ticketId: 'invalid' }
  };
  const res = {
    status: sinon.stub().returnsThis(),
    json: sinon.stub().returnsThis()
  };
  const next = sinon.stub();

  const findStub = sinon.stub(SupportTicket, 'findOne').resolves(null);

  await getSupportTicket(req, res, next);

  assert(res.status.calledWith(404));
  assert(res.json.calledWith({ message: 'Support ticket not found' }));

  findStub.restore();
});

test('getSupportTicket returns 403 for unauthorized access', async () => {
  const req = {
    user: { id: 'user123' },
    params: { ticketId: 'ticket123' }
  };
  const res = {
    status: sinon.stub().returnsThis(),
    json: sinon.stub().returnsThis()
  };
  const next = sinon.stub();

  const mockTicket = { id: 'ticket123', userId: 'otherUser' };
  const findStub = sinon.stub(SupportTicket, 'findOne').resolves(mockTicket);

  await getSupportTicket(req, res, next);

  assert(res.status.calledWith(403));
  assert(res.json.calledWith({ message: 'Access denied' }));

  findStub.restore();
});