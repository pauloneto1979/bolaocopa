const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");
const { required, toPositiveNumber } = require("../utils/validators");
const { hashPassword, verifyPassword } = require("../utils/password");
const poolService = require("./pool.service");

async function createUser(input) {
  required(input.name, "name");
  required(input.email, "email");

  const pool = await poolService.resolvePool(input.poolId);
  const entryFee = toPositiveNumber(input.entryFee ?? pool.entryFee, "entryFee");
  const email = String(input.email).trim().toLowerCase();
  const name = String(input.name).trim();

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, entryFee, poolId: pool.id },
      create: { name, email, entryFee, poolId: pool.id }
    });

    const membership = await prisma.poolParticipant.upsert({
      where: {
        poolId_userId: {
          poolId: pool.id,
          userId: user.id
        }
      },
      update: { entryFee },
      create: {
        poolId: pool.id,
        userId: user.id,
        entryFee
      },
      include: { user: true, pool: true }
    });

    return { ...membership.user, entryFee: membership.entryFee, pool: membership.pool };
  } catch (error) {
    if (error.code === "P2002") {
      throw new AppError("Ja existe usuario com este email.", 409);
    }
    throw error;
  }
}

async function listUsers(query = {}) {
  const pool = await poolService.resolvePool(query.poolId);

  const participants = await prisma.poolParticipant.findMany({
    where: { poolId: pool.id },
    orderBy: { user: { name: "asc" } },
    include: { user: true, pool: true }
  });

  return participants.map(item => ({
    ...item.user,
    entryFee: item.entryFee,
    pool: item.pool
  }));
}

async function updateUser(userId, input) {
  required(userId, "id");
  required(input.name, "name");
  required(input.email, "email");
  const entryFee = toPositiveNumber(input.entryFee ?? 0, "entryFee");
  const pool = await poolService.resolvePool(input.poolId);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("Usuario nao encontrado.", 404);

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: String(input.name).trim(),
        email: String(input.email).trim().toLowerCase(),
        entryFee
      }
    });

    const membership = await prisma.poolParticipant.upsert({
      where: {
        poolId_userId: {
          poolId: pool.id,
          userId
        }
      },
      update: { entryFee },
      create: { poolId: pool.id, userId, entryFee },
      include: { pool: true }
    });

    return { ...updated, entryFee: membership.entryFee, pool: membership.pool };
  } catch (error) {
    if (error.code === "P2002") {
      throw new AppError("Ja existe usuario com este email.", 409);
    }
    throw error;
  }
}

async function deleteUser(userId, query = {}) {
  required(userId, "id");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("Usuario nao encontrado.", 404);

  const pool = await poolService.resolvePool(query.poolId);
  await prisma.bet.deleteMany({ where: { userId, poolId: pool.id } });
  await prisma.poolParticipant.deleteMany({ where: { userId, poolId: pool.id } });
  return { deleted: true };
}

async function loginByEmail(email, password) {
  required(email, "email");

  const user = await prisma.user.findUnique({
    where: { email: String(email).trim().toLowerCase() },
    include: {
      poolParticipants: {
        include: { pool: true },
        orderBy: { pool: { name: "asc" } }
      }
    }
  });

  if (!user) throw new AppError("Email nao encontrado no cadastro de participantes.", 401);
  if (password && !verifyPassword(password, user.passwordHash)) {
    throw new AppError("Senha invalida.", 401);
  }

  if (!user.poolParticipants.length) {
    throw new AppError("Participante nao esta vinculado a nenhum bolao.", 401);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    pools: user.poolParticipants.map(item => ({
      id: item.pool.id,
      name: item.pool.name,
      entryFee: Number(item.entryFee)
    }))
  };
}

async function updatePassword(input) {
  required(input.userId, "userId");
  required(input.password, "password");

  const password = String(input.password);
  if (password.length < 4) {
    throw new AppError("A senha deve ter pelo menos 4 caracteres.", 400);
  }

  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) throw new AppError("Usuario nao encontrado.", 404);

  await prisma.user.update({
    where: { id: input.userId },
    data: { passwordHash: hashPassword(password) }
  });

  return { updated: true };
}

module.exports = {
  createUser,
  listUsers,
  updateUser,
  deleteUser,
  loginByEmail,
  updatePassword
};
