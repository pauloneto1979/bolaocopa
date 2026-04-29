const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");
const gameService = require("../services/game.service");

const list = asyncHandler(async (req, res) => {
  const games = await gameService.listGames(req.query);
  return success(res, games);
});

const create = asyncHandler(async (req, res) => {
  const game = await gameService.createGame(req.body);
  return success(res, game, 201);
});

const sync = asyncHandler(async (req, res) => {
  const result = await gameService.syncGames();
  return success(res, result);
});

const updateResult = asyncHandler(async (req, res) => {
  const game = await gameService.updateResult(req.params.id, req.body);
  return success(res, game);
});

const update = asyncHandler(async (req, res) => {
  const game = await gameService.updateGame(req.params.id, req.body);
  return success(res, game);
});

const remove = asyncHandler(async (req, res) => {
  const result = await gameService.deleteGame(req.params.id);
  return success(res, result);
});

module.exports = { create, list, sync, updateResult, update, remove };
