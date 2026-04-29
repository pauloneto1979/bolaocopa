const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");
const rankingService = require("../services/ranking.service");

const get = asyncHandler(async (req, res) => {
  const ranking = await rankingService.getRanking(req.query.poolId);
  return success(res, ranking);
});

module.exports = { get };
