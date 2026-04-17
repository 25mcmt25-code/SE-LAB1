const { Contract } = require('../models/Contract');

async function createContract(payload) {
  return Contract.create(payload);
}

async function getContractsByActor(actorId, role) {
  const criteria = role === 'buyer' ? { buyerId: actorId } : { farmerId: actorId };

  return Contract.find(criteria)
    .populate('buyerId', 'name email profilePhoto')
    .populate('farmerId', 'name email profilePhoto')
    .sort({ createdAt: -1 });
}

async function getContractById(contractId) {
  return Contract.findById(contractId)
    .populate('buyerId', 'name email profilePhoto')
    .populate('farmerId', 'name email profilePhoto');
}

async function saveContract(contract) {
  return contract.save();
}

module.exports = {
  createContract,
  getContractsByActor,
  getContractById,
  saveContract,
};

