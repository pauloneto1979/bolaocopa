const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");
const { required } = require("../utils/validators");

function teamPayload(input) {
  required(input.name, "name");

  return {
    name: String(input.name).trim(),
    crestUrl: input.crestUrl ? String(input.crestUrl).trim() : null
  };
}

async function createTeam(input) {
  try {
    return await prisma.team.create({
      data: teamPayload(input)
    });
  } catch (error) {
    if (error.code === "P2002") {
      throw new AppError("Ja existe um time com este nome.", 409);
    }
    throw error;
  }
}

async function listTeams(query = {}) {
  return prisma.team.findMany({
    orderBy: { name: "asc" }
  });
}

async function updateTeam(teamId, input) {
  required(teamId, "id");

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw new AppError("Time nao encontrado.", 404);

  try {
    return await prisma.team.update({
      where: { id: teamId },
      data: teamPayload(input)
    });
  } catch (error) {
    if (error.code === "P2002") {
      throw new AppError("Ja existe um time com este nome.", 409);
    }
    throw error;
  }
}

async function deleteTeam(teamId) {
  required(teamId, "id");

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw new AppError("Time nao encontrado.", 404);

  await prisma.team.delete({ where: { id: teamId } });
  return { deleted: true };
}

module.exports = {
  createTeam,
  listTeams,
  updateTeam,
  deleteTeam
};
