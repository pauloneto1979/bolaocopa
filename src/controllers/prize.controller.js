const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");
const prizeService = require("../services/prize.service");

const get = asyncHandler(async (req, res) => {
  const prizes = await prizeService.calculatePrizes(req.query.poolId);
  return success(res, prizes);
});

module.exports = { get };
