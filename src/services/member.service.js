const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");
const { required, toPositiveNumber } = require("../utils/validators");

const roles = ["OWNER", "ADMIN", "USER"];
const statuses = ["PENDING", "ACTIVE", "BLOCKED"];

function normalizeRole(value = "USER") {
  const role = String(value).toUpperCase();
  if (!roles.includes(role)) throw new AppError("Perfil invalido.", 400);
  return role;
}

function normalizeStatus(value = "PENDING") {
  const status = String(value).toUpperCase();
  if (!statuses.includes(status)) throw new AppError("Status invalido.", 400);
  return status;
}

async function ensureNotRemovingLastOwner(poolId, userId, nextRole, nextStatus) {
  const owners = await prisma.poolMember.count({
    where: {
      poolId,
      role: "OWNER",
      status: "ACTIVE",
      NOT: { userId }
    }
  });

  if (owners === 0 && (nextRole !== "OWNER" || nextStatus !== "ACTIVE")) {
    throw new AppError("O bolao precisa manter pelo menos um proprietario ativo.", 400);
  }
}

async function listMembers(poolId) {
  required(poolId, "poolId");

  return prisma.poolMember.findMany({
    where: { poolId },
    orderBy: [{ role: "asc" }, { user: { name: "asc" } }],
    include: { user: true }
  });
}

async function upsertMember(poolId, input) {
  required(poolId, "poolId");
  required(input.userId, "userId");

  const role = normalizeRole(input.role || "USER");
  const status = normalizeStatus(input.status || "ACTIVE");
  const entryValue = toPositiveNumber(input.entryValue ?? input.entryFee ?? 0, "entryValue");

  const [pool, user] = await Promise.all([
    prisma.pool.findUnique({ where: { id: poolId } }),
    prisma.user.findUnique({ where: { id: input.userId } })
  ]);

  if (!pool) throw new AppError("Bolao nao encontrado.", 404);
  if (!user) throw new AppError("Usuario nao encontrado.", 404);

  return prisma.poolMember.upsert({
    where: {
      poolId_userId: {
        poolId,
        userId: user.id
      }
    },
    update: { role, status, entryValue },
    create: {
      poolId,
      userId: user.id,
      role,
      status,
      entryValue
    },
    include: { user: true, pool: true }
  });
}

async function updateMember(poolId, memberId, input) {
  required(poolId, "poolId");
  required(memberId, "memberId");

  const member = await prisma.poolMember.findFirst({
    where: { id: memberId, poolId }
  });
  if (!member) throw new AppError("Membro nao encontrado.", 404);

  const role = input.role ? normalizeRole(input.role) : member.role;
  const status = input.status ? normalizeStatus(input.status) : member.status;
  const data = { role, status };

  if (input.entryValue !== undefined || input.entryFee !== undefined) {
    data.entryValue = toPositiveNumber(input.entryValue ?? input.entryFee, "entryValue");
  }

  await ensureNotRemovingLastOwner(poolId, member.userId, role, status);

  return prisma.poolMember.update({
    where: { id: memberId },
    data,
    include: { user: true, pool: true }
  });
}

async function deleteMember(poolId, memberId) {
  required(poolId, "poolId");
  required(memberId, "memberId");

  const member = await prisma.poolMember.findFirst({
    where: { id: memberId, poolId }
  });
  if (!member) throw new AppError("Membro nao encontrado.", 404);

  await ensureNotRemovingLastOwner(poolId, member.userId, "USER", "BLOCKED");
  await prisma.poolMember.delete({ where: { id: memberId } });
  return { deleted: true };
}

module.exports = {
  listMembers,
  upsertMember,
  updateMember,
  deleteMember
};
