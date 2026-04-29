const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");
const userService = require("../services/user.service");

const login = asyncHandler(async (req, res) => {
  const user = await userService.loginByEmail(req.body.email, req.body.password);
  return success(res, user);
});

const changePassword = asyncHandler(async (req, res) => {
  const result = await userService.updatePassword(req.body);
  return success(res, result);
});

module.exports = { login, changePassword };
