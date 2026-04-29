const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");
const { required, toNonNegativeInteger } = require("../utils/validators");
const apiFootballService = require("./apiFootball.service");
const { recalculateBetsForGame } = require("./score.service");

async function listGames(query = {}) {
  const where = {};

  if (query.status) {
    where.status = String(query.status).toUpperCase();
  }

  return prisma.game.findMany({
    where,
    orderBy: { gameDate: "asc" },
    include: {
      homeTeamRef: true,
      awayTeamRef: true,
      group: true
    }
  });
}

async function createGame(input) {
  required(input.homeTeamId, "homeTeamId");
  required(input.awayTeamId, "awayTeamId");
  required(input.groupId, "groupId");
  required(input.stadiumName, "stadiumName");
  required(input.gameDate, "gameDate");

  if (input.homeTeamId === input.awayTeamId) {
    throw new AppError("Mandante e visitante nao podem ser o mesmo time.", 400);
  }

  const [homeTeam, awayTeam, group] = await Promise.all([
    prisma.team.findUnique({ where: { id: input.homeTeamId } }),
    prisma.team.findUnique({ where: { id: input.awayTeamId } }),
    prisma.group.findUnique({ where: { id: input.groupId } })
  ]);

  if (!homeTeam) throw new AppError("Time mandante nao encontrado.", 404);
  if (!awayTeam) throw new AppError("Time visitante nao encontrado.", 404);
  if (!group) throw new AppError("Grupo nao encontrado.", 404);

  const gameDate = new Date(input.gameDate);
  if (Number.isNaN(gameDate.getTime())) {
    throw new AppError("gameDate invalido.", 400);
  }

  return prisma.game.create({
    data: {
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      groupId: group.id,
      homeTeam: homeTeam.name,
      awayTeam: awayTeam.name,
      stadiumName: String(input.stadiumName).trim(),
      gameDate,
      status: "SCHEDULED"
    },
    include: {
      homeTeamRef: true,
      awayTeamRef: true,
      group: true
    }
  });
}

async function updateGame(gameId, input) {
  required(gameId, "id");
  required(input.homeTeamId, "homeTeamId");
  required(input.awayTeamId, "awayTeamId");
  required(input.groupId, "groupId");
  required(input.stadiumName, "stadiumName");
  required(input.gameDate, "gameDate");

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new AppError("Jogo nao encontrado.", 404);

  if (input.homeTeamId === input.awayTeamId) {
    throw new AppError("Mandante e visitante nao podem ser o mesmo time.", 400);
  }

  const [homeTeam, awayTeam, group] = await Promise.all([
    prisma.team.findUnique({ where: { id: input.homeTeamId } }),
    prisma.team.findUnique({ where: { id: input.awayTeamId } }),
    prisma.group.findUnique({ where: { id: input.groupId } })
  ]);

  if (!homeTeam) throw new AppError("Time mandante nao encontrado.", 404);
  if (!awayTeam) throw new AppError("Time visitante nao encontrado.", 404);
  if (!group) throw new AppError("Grupo nao encontrado.", 404);

  const gameDate = new Date(input.gameDate);
  if (Number.isNaN(gameDate.getTime())) {
    throw new AppError("gameDate invalido.", 400);
  }

  const updated = await prisma.game.update({
    where: { id: gameId },
    data: {
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      groupId: group.id,
      homeTeam: homeTeam.name,
      awayTeam: awayTeam.name,
      stadiumName: String(input.stadiumName).trim(),
      gameDate
    },
    include: {
      homeTeamRef: true,
      awayTeamRef: true,
      group: true
    }
  });

  await recalculateBetsForGame(updated.id);
  return updated;
}

async function deleteGame(gameId) {
  required(gameId, "id");

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new AppError("Jogo nao encontrado.", 404);

  await prisma.game.delete({ where: { id: gameId } });
  return { deleted: true };
}

function resultChanged(previous, next) {
  return (
    previous.homeScore !== next.homeScore ||
    previous.awayScore !== next.awayScore ||
    previous.status !== next.status
  );
}

async function upsertSyncedGame(input) {
  const existing = await prisma.game.findUnique({
    where: { externalId: input.externalId }
  });

  const data = {
    homeTeam: input.homeTeam,
    awayTeam: input.awayTeam,
    gameDate: input.gameDate,
    homeScore: input.homeScore,
    awayScore: input.awayScore,
    status: input.status
  };

  if (!existing) {
    const created = await prisma.game.create({
      data: {
        externalId: input.externalId,
        ...data
      }
    });

    return { game: created, changed: created.status === "FINISHED", created: true };
  }

  const changed = resultChanged(existing, data);
  const game = await prisma.game.update({
    where: { id: existing.id },
    data
  });

  return { game, changed, created: false };
}

async function syncGames() {
  const fixtures = await apiFootballService.fetchWorldCupFixtures();
  let created = 0;
  let updated = 0;
  let recalculatedBets = 0;

  for (const fixture of fixtures) {
    const result = await upsertSyncedGame(fixture);
    if (result.created) created += 1;
    if (!result.created && result.changed) updated += 1;

    if (result.changed && result.game.status === "FINISHED") {
      const recalculation = await recalculateBetsForGame(result.game.id);
      recalculatedBets += recalculation.updated;
    }
  }

  return {
    totalFromApi: fixtures.length,
    created,
    updated,
    recalculatedBets
  };
}

async function updateResult(gameId, input) {
  required(gameId, "id");

  const game = await prisma.game.findUnique({
    where: { id: gameId }
  });

  if (!game) throw new AppError("Jogo nao encontrado.", 404);

  const homeScore = toNonNegativeInteger(input.homeScore, "homeScore");
  const awayScore = toNonNegativeInteger(input.awayScore, "awayScore");

  const updated = await prisma.game.update({
    where: { id: gameId },
    data: {
      homeScore,
      awayScore,
      status: "FINISHED"
    }
  });

  await recalculateBetsForGame(updated.id);

  return updated;
}

module.exports = {
  createGame,
  updateGame,
  deleteGame,
  listGames,
  syncGames,
  updateResult
};
