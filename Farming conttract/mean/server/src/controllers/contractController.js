const { User } = require('../models/User');
const repository = require('../repositories/contractRepository');
const {
  validateContractPayload,
  buildContractPayload,
  validateStatusTransition,
  buildStatusUpdate,
  toPublicContract,
} = require('../services/contractService');

function createContractController(dependencies = {}) {
  const createContract = dependencies.createContract || repository.createContract;
  const getContractsByActor = dependencies.getContractsByActor || repository.getContractsByActor;
  const getContractById = dependencies.getContractById || repository.getContractById;
  const saveContract = dependencies.saveContract || repository.saveContract;
  const findFarmerById = dependencies.findFarmerById
    || ((farmerId) => User.findOne({ _id: farmerId, role: 'farmer' }).select('_id'));
  const findBuyerById = dependencies.findBuyerById
    || ((buyerId) => User.findOne({ _id: buyerId, role: 'buyer' }).select('_id'));

  return {
    async submitContract(req, res, next) {
      try {
        const actorRole = req.user?.role;
        if (!['buyer', 'farmer'].includes(actorRole)) {
          return res.status(403).json({ message: 'Only buyers or farmers can create contract requests' });
        }

        const requestedFarmerId = String(req.body?.farmerId || '').trim();
        const requestedBuyerId = String(req.body?.buyerId || '').trim();

        const buyerId = actorRole === 'buyer' ? String(req.user.userId) : requestedBuyerId;
        const farmerId = actorRole === 'farmer' ? String(req.user.userId) : requestedFarmerId;

        const requiredField = actorRole === 'buyer' ? 'farmerId' : 'buyerId';
        const requiredValue = actorRole === 'buyer' ? farmerId : buyerId;
        if (!requiredValue) {
          return res.status(400).json({
            message: 'Validation error',
            errors: [{ field: requiredField, message: `${requiredField} is required` }],
          });
        }

        if (buyerId === farmerId) {
          return res.status(400).json({
            message: 'Validation error',
            errors: [{ field: 'counterparty', message: 'Buyer and farmer must be different users' }],
          });
        }

        const errors = validateContractPayload(req.body);
        if (errors.length) {
          return res.status(400).json({ message: 'Validation error', errors });
        }

        const farmer = await findFarmerById(farmerId);
        if (!farmer) {
          return res.status(404).json({ message: 'Farmer account not found' });
        }

        const buyer = await findBuyerById(buyerId);
        if (!buyer) {
          return res.status(404).json({ message: 'Buyer account not found' });
        }

        const payload = buildContractPayload(req.body, buyer._id, farmer._id, actorRole);
        const created = await createContract(payload);
        const full = await getContractById(created._id);

        return res.status(201).json({
          message: 'Contract request created',
          contract: toPublicContract(full || created),
        });
      } catch (err) {
        return next(err);
      }
    },

    async getMyContracts(req, res, next) {
      try {
        if (!['buyer', 'farmer'].includes(req.user?.role)) {
          return res.status(403).json({ message: 'Only buyers or farmers can view contracts' });
        }

        const contracts = await getContractsByActor(req.user.userId, req.user.role);
        return res.json({
          contracts: contracts.map((contract) => toPublicContract(contract)),
        });
      } catch (err) {
        return next(err);
      }
    },

    async getContractDetails(req, res, next) {
      try {
        const contract = await getContractById(req.params.contractId);
        if (!contract) {
          return res.status(404).json({ message: 'Contract not found' });
        }

        const actorId = req.user?.userId;
        const permitted = contract.buyerId?._id?.toString?.() === actorId
          || contract.farmerId?._id?.toString?.() === actorId
          || contract.buyerId?.toString?.() === actorId
          || contract.farmerId?.toString?.() === actorId;
        if (!permitted) {
          return res.status(403).json({ message: 'You are not allowed to access this contract' });
        }

        return res.json({
          contract: toPublicContract(contract),
        });
      } catch (err) {
        return next(err);
      }
    },

    async updateContractStatus(req, res, next) {
      try {
        const contract = await getContractById(req.params.contractId);
        if (!contract) {
          return res.status(404).json({ message: 'Contract not found' });
        }

        const actorRole = req.user?.role;
        const actorId = req.user?.userId;
        const isFarmerActor = contract.farmerId?._id?.toString?.() === actorId
          || contract.farmerId?.toString?.() === actorId;
        const isBuyerActor = contract.buyerId?._id?.toString?.() === actorId
          || contract.buyerId?.toString?.() === actorId;

        if ((actorRole === 'farmer' && !isFarmerActor) || (actorRole === 'buyer' && !isBuyerActor)) {
          return res.status(403).json({ message: 'You are not allowed to update this contract' });
        }
        if (!['farmer', 'buyer'].includes(actorRole)) {
          return res.status(403).json({ message: 'Only buyers or farmers can update contracts' });
        }

        const nextStatus = String(req.body?.status || '').trim().toLowerCase();
        const transitionError = validateStatusTransition(contract.status, nextStatus, actorRole);
        if (transitionError) {
          return res.status(400).json({ message: transitionError });
        }

        const update = buildStatusUpdate({
          contract,
          nextStatus,
          actorRole,
          decisionNote: req.body?.decisionNote,
        });
        contract.status = update.status;
        contract.notifications = update.notifications;
        if (typeof update.farmerDecisionNote === 'string') {
          contract.farmerDecisionNote = update.farmerDecisionNote;
        }

        const saved = await saveContract(contract);
        const full = await getContractById(saved._id);

        return res.json({
          message: 'Contract status updated',
          contract: toPublicContract(full || saved),
        });
      } catch (err) {
        return next(err);
      }
    },
  };
}

const defaultController = createContractController();

module.exports = {
  createContractController,
  submitContract: defaultController.submitContract,
  getMyContracts: defaultController.getMyContracts,
  getContractDetails: defaultController.getContractDetails,
  updateContractStatus: defaultController.updateContractStatus,
};
