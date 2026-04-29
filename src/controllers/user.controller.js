const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");
const userService = require("../services/user.service");

const create = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  return success(res, user, 201);
});

const list = asyncHandler(async (req, res) => {
  const users = await userService.listUsers(req.query);
  return success(res, users);
});

const update = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  return success(res, user);
});

const remove = asyncHandler(async (req, res) => {
  const result = await userService.deleteUser(req.params.id, req.query);
  return success(res, result);
});

module.exports = { create, list, update, remove };
