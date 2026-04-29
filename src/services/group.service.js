const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");
const { required } = require("../utils/validators");

function payload(input) {
  required(input.name, "name");
  return { name: String(input.name).trim().toUpperCase() };
}

async function createGroup(input) {
  try {
    return await prisma.group.create({ data: payload(input) });
  } catch (error) {
    if (error.code === "P2002") throw new AppError("Ja existe um grupo com este nome.", 409);
    throw error;
  }
}

async function listGroups() {
  return prisma.group.findMany({ orderBy: { name: "asc" } });
}

async function updateGroup(groupId, input) {
  required(groupId, "id");
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new AppError("Grupo nao encontrado.", 404);

  try {
    return await prisma.group.update({ where: { id: groupId }, data: payload(input) });
  } catch (error) {
    if (error.code === "P2002") throw new AppError("Ja existe um grupo com este nome.", 409);
    throw error;
  }
}

async function deleteGroup(groupId) {
  required(groupId, "id");
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new AppError("Grupo nao encontrado.", 404);
  await prisma.group.delete({ where: { id: groupId } });
  return { deleted: true };
}

module.exports = { createGroup, listGroups, updateGroup, deleteGroup };
