const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");
const memberService = require("../services/member.service");

const list = asyncHandler(async (req, res) => {
  const members = await memberService.listMembers(req.params.poolId);
  return success(res, members);
});

const create = asyncHandler(async (req, res) => {
  const member = await memberService.upsertMember(req.params.poolId, req.body);
  return success(res, member, 201);
});

const update = asyncHandler(async (req, res) => {
  const member = await memberService.updateMember(req.params.poolId, req.params.memberId, req.body);
  return success(res, member);
});

const remove = asyncHandler(async (req, res) => {
  const result = await memberService.deleteMember(req.params.poolId, req.params.memberId);
  return success(res, result);
});

module.exports = {
  list,
  create,
  update,
  remove
};
