const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");
const teamService = require("../services/team.service");

const create = asyncHandler(async (req, res) => {
  const team = await teamService.createTeam(req.body);
  return success(res, team, 201);
});

const list = asyncHandler(async (req, res) => {
  const teams = await teamService.listTeams(req.query);
  return success(res, teams);
});

const update = asyncHandler(async (req, res) => {
  const team = await teamService.updateTeam(req.params.id, req.body);
  return success(res, team);
});

const remove = asyncHandler(async (req, res) => {
  const result = await teamService.deleteTeam(req.params.id);
  return success(res, result);
});

module.exports = {
  create,
  list,
  update,
  remove
};
