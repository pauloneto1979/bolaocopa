const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");
const userService = require("../services/user.service");

const register = asyncHandler(async (req, res) => {
  const user = await userService.register(req.body);
  return success(res, user, 201);
});

const login = asyncHandler(async (req, res) => {
  const user = await userService.loginByEmail(req.body.email, req.body.password);
  return success(res, user);
});

const me = asyncHandler(async (req, res) => {
  const user = await userService.getSessionUser(req.user.id);
  return success(res, user);
});

const changePassword = asyncHandler(async (req, res) => {
  const result = await userService.updatePassword({
    ...req.body,
    userId: req.user.id
  });
  return success(res, result);
});

module.exports = { register, login, me, changePassword };
