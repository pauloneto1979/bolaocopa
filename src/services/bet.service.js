const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");
const { required, toNonNegativeInteger, toPositiveNumber } = require("../utils/validators");
const { calculatePoints } = require("./score.service");
const poolService = require("./pool.service");

const betInclude = {
  user: true,
  game: {
    include: {
      homeTeamRef: true,
      awayTeamRef: true,
      group: true
    }
  }
};

function ensureBettingIsOpen(game) {
  const closeAt = new Date(game.gameDate).getTime() - 10 * 60 * 1000;
  if (Date.now() >= closeAt) {
    throw new AppError("Apostas encerradas para este jogo. O limite e 10 minutos antes da partida.", 400);
  }
}

async function ensureParticipantInPool(userId, poolId) {
  const membership = await prisma.poolMember.findUnique({
    where: {
      poolId_userId: {
        poolId,
        userId
      }
    }
  });

  if (!membership) {
    throw new AppError("Usuario nao participa deste bolao.", 400);
  }
  if (membership.status !== "ACTIVE") {
    throw new AppError("Usuario pendente ou bloqueado nao pode apostar.", 403);
  }
}

async function createBet(input) {
  required(input.userId, "userId");
  required(input.gameId, "gameId");

  if (input.authRole === "USER" && input.userId !== input.authUserId) {
    throw new AppError("Usuario comum so pode apostar para si mesmo.", 403);
  }

  const pool = await poolService.resolvePool(input.poolId);
  const homeScore = toNonNegativeInteger(input.homeScore, "homeScore");
  const awayScore = toNonNegativeInteger(input.awayScore, "awayScore");
  const betAmount = toPositiveNumber(input.betAmount ?? 0, "betAmount");

  const [user, game] = await Promise.all([
    prisma.user.findUnique({ where: { id: input.userId } }),
    prisma.game.findUnique({ where: { id: input.gameId } })
  ]);

  if (!user) throw new AppError("Usuario nao encontrado.", 404);
  if (!game) throw new AppError("Jogo nao encontrado.", 404);
  await ensureParticipantInPool(user.id, pool.id);
  ensureBettingIsOpen(game);

  const points = calculatePoints({ homeScore, awayScore }, game);

  try {
    return await prisma.bet.create({
      data: {
        poolId: pool.id,
        userId: user.id,
        gameId: game.id,
        homeScore,
        awayScore,
        betAmount,
        points
      },
      include: betInclude
    });
  } catch (error) {
    if (error.code === "P2002") {
      throw new AppError("Este usuario ja fez uma aposta para este jogo.", 409);
    }
    throw error;
  }
}

async function listBetsByUser(userId, query = {}) {
  required(userId, "id");

  if (query.authRole === "USER" && userId !== query.authUserId) {
    throw new AppError("Usuario comum so pode visualizar suas proprias apostas.", 403);
  }

  const pool = await poolService.resolvePool(query.poolId);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("Usuario nao encontrado.", 404);

  return prisma.bet.findMany({
    where: { userId, poolId: pool.id },
    orderBy: { game: { gameDate: "asc" } },
    include: betInclude
  });
}

async function listBets(query = {}) {
  const pool = await poolService.resolvePool(query.poolId);
  const where = { poolId: pool.id };

  if (query.userId) where.userId = query.userId;
  if (query.gameId) where.gameId = query.gameId;
  if (query.authRole === "USER") where.userId = query.authUserId;

  return prisma.bet.findMany({
    where,
    orderBy: [{ user: { name: "asc" } }, { game: { gameDate: "asc" } }],
    include: betInclude
  });
}

async function updateBet(betId, input) {
  required(betId, "id");
  required(input.userId, "userId");
  required(input.gameId, "gameId");

  const bet = await prisma.bet.findUnique({
    where: { id: betId }
  });

  if (!bet) throw new AppError("Aposta nao encontrada.", 404);
  if (input.authRole === "USER" && bet.userId !== input.authUserId) {
    throw new AppError("Usuario comum so pode editar suas proprias apostas.", 403);
  }
  if (input.authRole === "USER" && input.userId !== input.authUserId) {
    throw new AppError("Usuario comum so pode apostar para si mesmo.", 403);
  }

  const pool = await poolService.resolvePool(input.poolId || bet.poolId);
  const [user, game] = await Promise.all([
    prisma.user.findUnique({ where: { id: input.userId } }),
    prisma.game.findUnique({ where: { id: input.gameId } })
  ]);

  if (!user) throw new AppError("Usuario nao encontrado.", 404);
  if (!game) throw new AppError("Jogo nao encontrado.", 404);
  await ensureParticipantInPool(user.id, pool.id);
  ensureBettingIsOpen(game);

  const homeScore = toNonNegativeInteger(input.homeScore, "homeScore");
  const awayScore = toNonNegativeInteger(input.awayScore, "awayScore");
  const betAmount = toPositiveNumber(input.betAmount ?? 0, "betAmount");
  const points = calculatePoints({ homeScore, awayScore }, game);

  try {
    return await prisma.bet.update({
      where: { id: betId },
      data: {
        poolId: pool.id,
        userId: user.id,
        gameId: game.id,
        homeScore,
        awayScore,
        betAmount,
        points
      },
      include: betInclude
    });
  } catch (error) {
    if (error.code === "P2002") {
      throw new AppError("Este usuario ja fez uma aposta para este jogo.", 409);
    }
    throw error;
  }
}

async function deleteBet(betId, context = {}) {
  required(betId, "id");

  const bet = await prisma.bet.findUnique({ where: { id: betId } });
  if (!bet) throw new AppError("Aposta nao encontrada.", 404);
  if (context.authRole === "USER" && bet.userId !== context.authUserId) {
    throw new AppError("Usuario comum so pode excluir suas proprias apostas.", 403);
  }

  await prisma.bet.delete({ where: { id: betId } });
  return { deleted: true };
}

module.exports = {
  createBet,
  listBets,
  listBetsByUser,
  updateBet,
  deleteBet
};
