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
      entryFee: 50
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
  const entryFee = toPositiveNumber(input.entryFee, "entryFee");

  return prisma.pool.create({
    data: {
      name: String(input.name).trim(),
      entryFee
    }
  });
}

async function updatePool(poolId, input) {
  required(poolId, "id");
  required(input.name, "name");
  const entryFee = toPositiveNumber(input.entryFee, "entryFee");

  const pool = await prisma.pool.findUnique({ where: { id: poolId } });
  if (!pool) throw new AppError("Bolao nao encontrado.", 404);

  return prisma.pool.update({
    where: { id: poolId },
    data: {
      name: String(input.name).trim(),
      entryFee
    }
  });
}

async function deletePool(poolId) {
  required(poolId, "id");

  const pool = await prisma.pool.findUnique({
    where: { id: poolId },
    include: {
      _count: {
        select: {
          participants: true,
          bets: true,
          prizes: true
        }
      }
    }
  });

  if (!pool) throw new AppError("Bolao nao encontrado.", 404);

  const hasData = pool._count.participants > 0 || pool._count.bets > 0 || pool._count.prizes > 0;
  if (hasData) {
    throw new AppError("Nao e permitido excluir um bolao com participantes, apostas ou premiacoes. Exclua os dados vinculados antes.", 400);
  }

  await prisma.pool.delete({ where: { id: poolId } });
  return { deleted: true };
}

async function listPools() {
  return prisma.pool.findMany({
    orderBy: { name: "asc" }
  });
}

module.exports = {
  getDefaultPool,
  resolvePool,
  createPool,
  updatePool,
  deletePool,
  listPools
};
