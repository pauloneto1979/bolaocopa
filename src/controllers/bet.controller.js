const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");
const betService = require("../services/bet.service");

const create = asyncHandler(async (req, res) => {
  const bet = await betService.createBet({
    ...req.body,
    authUserId: req.user.id,
    authRole: req.poolMember?.role
  });
  return success(res, bet, 201);
});

const list = asyncHandler(async (req, res) => {
  const bets = await betService.listBets({
    ...req.query,
    authUserId: req.user.id,
    authRole: req.poolMember?.role
  });
  return success(res, bets);
});

const listByUser = asyncHandler(async (req, res) => {
  const bets = await betService.listBetsByUser(req.params.id, {
    ...req.query,
    authUserId: req.user.id,
    authRole: req.poolMember?.role
  });
  return success(res, bets);
});

const update = asyncHandler(async (req, res) => {
  const bet = await betService.updateBet(req.params.id, {
    ...req.body,
    authUserId: req.user.id,
    authRole: req.poolMember?.role
  });
  return success(res, bet);
});

const remove = asyncHandler(async (req, res) => {
  const result = await betService.deleteBet(req.params.id, {
    authUserId: req.user.id,
    authRole: req.poolMember?.role
  });
  return success(res, result);
});

module.exports = { create, list, listByUser, update, remove };
