const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");
const { required, toPositiveNumber } = require("../utils/validators");

async function getDefaultPool() {
  if (process.env.DEFAULT_POOL_ID) {
    const pool = await prisma.pool.findUnique({
      where: { id: process.env.DEFAULT_POOL_ID }
    });

    if (!pool) {
      throw new AppError("DEFAULT_POOL_ID nao encontrado no banco.", 500);
    }

    return pool;
  }

  const existing = await prisma.pool.findFirst({
    orderBy: { createdAt: "asc" }
  });

  if (existing) return existing;

  return prisma.pool.create({
    data: {
      name: "BolaoCopa",
      entryFee: 50,
      entryValue: 50
    }
  });
}

async function resolvePool(poolId) {
  if (!poolId) return getDefaultPool();

  const pool = await prisma.pool.findUnique({
    where: { id: poolId }
  });

  if (!pool) {
    throw new AppError("Bolao nao encontrado.", 404);
  }

  return pool;
}

async function createPool(input) {
  required(input.name, "name");
  required(input.ownerId, "ownerId");
  const entryValue = toPositiveNumber(input.entryValue ?? input.entryFee, "entryValue");

  const user = await prisma.user.findUnique({ where: { id: input.ownerId } });
  if (!user) throw new AppError("Proprietario nao encontrado.", 404);

  return prisma.pool.create({
    data: {
      name: String(input.name).trim(),
      entryFee: entryValue,
      entryValue,
      status: "OPEN",
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: "OWNER",
          status: "ACTIVE",
          entryValue
        }
      }
    },
    include: {
      owner: true,
      members: true
    }
  });
}

async function updatePool(poolId, input) {
  required(poolId, "id");
  required(input.name, "name");
  const entryValue = toPositiveNumber(input.entryValue ?? input.entryFee, "entryValue");

  const pool = await prisma.pool.findUnique({ where: { id: poolId } });
  if (!pool) throw new AppError("Bolao nao encontrado.", 404);

  return prisma.pool.update({
    where: { id: poolId },
    data: {
      name: String(input.name).trim(),
      entryFee: entryValue,
      entryValue
    }
  });
}

async function setPoolStatus(poolId, status) {
  required(poolId, "id");

  const pool = await prisma.pool.findUnique({ where: { id: poolId } });
  if (!pool) throw new AppError("Bolao nao encontrado.", 404);

  return prisma.pool.update({
    where: { id: poolId },
    data: {
      status,
      closedAt: status === "CLOSED" ? new Date() : null
    }
  });
}

async function closePool(poolId) {
  return setPoolStatus(poolId, "CLOSED");
}

async function reopenPool(poolId) {
  return setPoolStatus(poolId, "OPEN");
}

async function deletePool(poolId) {
  required(poolId, "id");

  const pool = await prisma.pool.findUnique({
    where: { id: poolId },
    include: {
      _count: {
        select: {
          participants: true,
          members: true,
          bets: true,
          prizes: true
        }
      }
    }
  });

  if (!pool) throw new AppError("Bolao nao encontrado.", 404);

  const hasData = pool._count.participants > 0 || pool._count.members > 0 || pool._count.bets > 0 || pool._count.prizes > 0;
  if (hasData) {
    throw new AppError("Nao e permitido excluir um bolao com participantes, apostas ou premiacoes. Exclua os dados vinculados antes.", 400);
  }

  await prisma.pool.delete({ where: { id: poolId } });
  return { deleted: true };
}

async function listPools() {
  return prisma.pool.findMany({
    orderBy: { name: "asc" },
    include: {
      owner: true
    }
  });
}

module.exports = {
  getDefaultPool,
  resolvePool,
  createPool,
  updatePool,
  closePool,
  reopenPool,
  deletePool,
  listPools
};
