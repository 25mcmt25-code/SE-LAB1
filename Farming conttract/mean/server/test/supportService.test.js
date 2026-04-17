const test = require('node:test');
const assert = require('node:assert/strict');
const sinon = require('sinon');

const SupportService = require('../src/services/supportService');
const SupportTicket = require('../src/models/SupportTicket');

test('SupportService.createTicket creates a support ticket with valid data', async () => {
  const supportService = new SupportService();
  const ticketData = {
    userId: 'user123',
    subject: 'Test Issue',
    category: 'technical',
    priority: 'high',
    description: 'This is a test issue'
  };

  const mockTicket = { id: 'ticket123', ...ticketData, status: 'open' };
  const ticketStub = sinon.stub(SupportTicket, 'create').resolves(mockTicket);

  const result = await supportService.createTicket(ticketData);

  assert.deepEqual(result, mockTicket);
  assert(ticketStub.calledWith({
    ...ticketData,
    status: 'open',
    notifications: []
  }));

  ticketStub.restore();
});

test('SupportService.createTicket throws error for invalid category', async () => {
  const supportService = new SupportService();
  const ticketData = {
    userId: 'user123',
    subject: 'Test Issue',
    category: 'invalid',
    priority: 'high',
    description: 'This is a test issue'
  };

  await assert.rejects(
    async () => await supportService.createTicket(ticketData),
    { message: 'Invalid support category' }
  );
});

test('SupportService.createTicket throws error for invalid priority', async () => {
  const supportService = new SupportService();
  const ticketData = {
    userId: 'user123',
    subject: 'Test Issue',
    category: 'technical',
    priority: 'invalid',
    description: 'This is a test issue'
  };

  await assert.rejects(
    async () => await supportService.createTicket(ticketData),
    { message: 'Invalid priority level' }
  );
});

test('SupportService.notifyUser adds notification to ticket', async () => {
  const supportService = new SupportService();
  const ticketId = 'ticket123';
  const message = 'Your ticket has been updated';
  const mockTicket = {
    id: ticketId,
    notifications: [],
    save: sinon.stub().resolves()
  };

  const findStub = sinon.stub(SupportTicket, 'findById').resolves(mockTicket);

  await supportService.notifyUser(ticketId, message);

  assert.equal(mockTicket.notifications.length, 1);
  assert.equal(mockTicket.notifications[0].message, message);
  assert(mockTicket.notifications[0].createdAt);
  assert(mockTicket.save.calledOnce);

  findStub.restore();
});

test('SupportService.notifyUser throws error if ticket not found', async () => {
  const supportService = new SupportService();

  const findStub = sinon.stub(SupportTicket, 'findById').resolves(null);

  await assert.rejects(
    async () => await supportService.notifyUser('invalid', 'message'),
    { message: 'Support ticket not found' }
  );

  findStub.restore();
});