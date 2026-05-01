const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");
const { required, toPositiveNumber } = require("../utils/validators");
const { hashPassword, verifyPassword } = require("../utils/password");
const { signToken } = require("../utils/jwt");
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

    const membership = await prisma.poolMember.upsert({
      where: {
        poolId_userId: {
          poolId: pool.id,
          userId: user.id
        }
      },
      update: { entryValue: entryFee },
      create: {
        poolId: pool.id,
        userId: user.id,
        role: input.role || "USER",
        status: input.status || "ACTIVE",
        entryValue: entryFee
      },
      include: { user: true, pool: true }
    });

    return {
      ...membership.user,
      entryFee: membership.entryValue,
      entryValue: membership.entryValue,
      role: membership.role,
      status: membership.status,
      pool: membership.pool
    };
  } catch (error) {
    if (error.code === "P2002") {
      throw new AppError("Ja existe usuario com este email.", 409);
    }
    throw error;
  }
}

async function listUsers(query = {}) {
  const pool = await poolService.resolvePool(query.poolId);

  const participants = await prisma.poolMember.findMany({
    where: { poolId: pool.id },
    orderBy: { user: { name: "asc" } },
    include: { user: true, pool: true }
  });

  return participants.map(item => ({
    ...item.user,
    entryFee: item.entryValue,
    entryValue: item.entryValue,
    role: item.role,
    status: item.status,
    pool: item.pool
  }));
}

async function createAccount(input) {
  required(input.name, "name");
  required(input.email, "email");
  required(input.password, "password");

  const password = String(input.password);
  if (password.length < 4) throw new AppError("A senha deve ter pelo menos 4 caracteres.", 400);

  try {
    const user = await prisma.user.create({
      data: {
        name: String(input.name).trim(),
        email: String(input.email).trim().toLowerCase(),
        passwordHash: hashPassword(password)
      }
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      hasPassword: Boolean(user.passwordHash),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  } catch (error) {
    if (error.code === "P2002") throw new AppError("Ja existe usuario com este email.", 409);
    throw error;
  }
}

async function listAccounts() {
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          poolMemberships: true,
          bets: true,
          prizes: true,
          ownedPools: true
        }
      }
    }
  });

  return users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    hasPassword: Boolean(user.passwordHash),
    membershipsCount: user._count.poolMemberships,
    betsCount: user._count.bets,
    prizesCount: user._count.prizes,
    ownedPoolsCount: user._count.ownedPools,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  }));
}

async function updateAccount(userId, input) {
  required(userId, "id");
  required(input.name, "name");
  required(input.email, "email");

  const data = {
    name: String(input.name).trim(),
    email: String(input.email).trim().toLowerCase()
  };

  if (input.password) {
    const password = String(input.password);
    if (password.length < 4) throw new AppError("A senha deve ter pelo menos 4 caracteres.", 400);
    data.passwordHash = hashPassword(password);
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      hasPassword: Boolean(user.passwordHash),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  } catch (error) {
    if (error.code === "P2025") throw new AppError("Usuario nao encontrado.", 404);
    if (error.code === "P2002") throw new AppError("Ja existe usuario com este email.", 409);
    throw error;
  }
}

async function deleteAccount(userId) {
  required(userId, "id");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          poolMemberships: true,
          bets: true,
          prizes: true,
          ownedPools: true
        }
      }
    }
  });

  if (!user) throw new AppError("Usuario nao encontrado.", 404);

  const hasData = user._count.poolMemberships > 0 || user._count.bets > 0 || user._count.prizes > 0 || user._count.ownedPools > 0;
  if (hasData) {
    throw new AppError("Nao e permitido excluir usuario com vinculos, apostas, premios ou boloes proprietarios.", 400);
  }

  await prisma.user.delete({ where: { id: userId } });
  return { deleted: true };
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

    const membership = await prisma.poolMember.upsert({
      where: {
        poolId_userId: {
          poolId: pool.id,
          userId
        }
      },
      update: { entryValue: entryFee },
      create: { poolId: pool.id, userId, role: "USER", status: "ACTIVE", entryValue: entryFee },
      include: { pool: true }
    });

    return {
      ...updated,
      entryFee: membership.entryValue,
      entryValue: membership.entryValue,
      role: membership.role,
      status: membership.status,
      pool: membership.pool
    };
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
  await prisma.poolMember.deleteMany({ where: { userId, poolId: pool.id } });
  return { deleted: true };
}

async function register(input) {
  required(input.name, "name");
  required(input.email, "email");
  required(input.password, "password");

  const password = String(input.password);
  if (password.length < 4) throw new AppError("A senha deve ter pelo menos 4 caracteres.", 400);

  try {
    const user = await prisma.user.create({
      data: {
        name: String(input.name).trim(),
        email: String(input.email).trim().toLowerCase(),
        passwordHash: hashPassword(password)
      }
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email
    };
  } catch (error) {
    if (error.code === "P2002") throw new AppError("Ja existe usuario com este email.", 409);
    throw error;
  }
}

async function loginByEmail(email, password) {
  required(email, "email");
  required(password, "password");

  const user = await prisma.user.findUnique({
    where: { email: String(email).trim().toLowerCase() },
    include: {
      poolMemberships: {
        include: { pool: true },
        orderBy: { pool: { name: "asc" } }
      }
    }
  });

  if (!user) throw new AppError("Email nao encontrado no cadastro de participantes.", 401);
  if (!verifyPassword(password, user.passwordHash)) {
    throw new AppError("Senha invalida.", 401);
  }

  if (!user.poolMemberships.length) {
    throw new AppError("Participante nao esta vinculado a nenhum bolao.", 401);
  }

  const token = signToken({ userId: user.id, email: user.email });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    token,
    pools: user.poolMemberships.map(item => ({
      id: item.pool.id,
      name: item.pool.name,
      entryFee: Number(item.entryValue),
      entryValue: Number(item.entryValue),
      role: item.role,
      status: item.status,
      isAdmin: item.role === "OWNER" || item.role === "ADMIN"
    }))
  };
}

async function getSessionUser(userId) {
  required(userId, "userId");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      poolMemberships: {
        include: { pool: true },
        orderBy: { pool: { name: "asc" } }
      }
    }
  });

  if (!user) throw new AppError("Usuario nao encontrado.", 404);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    pools: user.poolMemberships.map(item => ({
      id: item.pool.id,
      name: item.pool.name,
      entryFee: Number(item.entryValue),
      entryValue: Number(item.entryValue),
      role: item.role,
      status: item.status,
      isAdmin: item.role === "OWNER" || item.role === "ADMIN"
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
  register,
  createAccount,
  listAccounts,
  updateAccount,
  deleteAccount,
  listUsers,
  updateUser,
  deleteUser,
  loginByEmail,
  getSessionUser,
  updatePassword
};
