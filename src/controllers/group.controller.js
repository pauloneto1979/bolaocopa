const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");
const groupService = require("../services/group.service");

const create = asyncHandler(async (req, res) => {
  const group = await groupService.createGroup(req.body);
  return success(res, group, 201);
});

const list = asyncHandler(async (req, res) => {
  const groups = await groupService.listGroups();
  return success(res, groups);
});

const update = asyncHandler(async (req, res) => {
  const group = await groupService.updateGroup(req.params.id, req.body);
  return success(res, group);
});

const remove = asyncHandler(async (req, res) => {
  const result = await groupService.deleteGroup(req.params.id);
  return success(res, result);
});

module.exports = { create, list, update, remove };
