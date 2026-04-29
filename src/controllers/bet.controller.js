const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");
const betService = require("../services/bet.service");

const create = asyncHandler(async (req, res) => {
  const bet = await betService.createBet(req.body);
  return success(res, bet, 201);
});

const list = asyncHandler(async (req, res) => {
  const bets = await betService.listBets(req.query);
  return success(res, bets);
});

const listByUser = asyncHandler(async (req, res) => {
  const bets = await betService.listBetsByUser(req.params.id, req.query);
  return success(res, bets);
});

const update = asyncHandler(async (req, res) => {
  const bet = await betService.updateBet(req.params.id, req.body);
  return success(res, bet);
});

const remove = asyncHandler(async (req, res) => {
  const result = await betService.deleteBet(req.params.id);
  return success(res, result);
});

module.exports = { create, list, listByUser, update, remove };
