const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");
const poolService = require("../services/pool.service");

const create = asyncHandler(async (req, res) => {
  const pool = await poolService.createPool(req.body);
  return success(res, pool, 201);
});

const list = asyncHandler(async (req, res) => {
  const pools = await poolService.listPools();
  return success(res, pools);
});

const update = asyncHandler(async (req, res) => {
  const pool = await poolService.updatePool(req.params.id, req.body);
  return success(res, pool);
});

const remove = asyncHandler(async (req, res) => {
  const result = await poolService.deletePool(req.params.id);
  return success(res, result);
});

module.exports = { create, list, update, remove };
