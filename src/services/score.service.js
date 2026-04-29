const prisma = require("../config/prisma");

function isFinished(game) {
  return game.status === "FINISHED" && game.homeScore !== null && game.awayScore !== null;
}

function outcome(homeScore, awayScore) {
  return Math.sign(homeScore - awayScore);
}

function calculatePoints(bet, game) {
  if (!isFinished(game)) return 0;

  if (bet.homeScore === game.homeScore && bet.awayScore === game.awayScore) {
    return 20;
  }

  if (outcome(bet.homeScore, bet.awayScore) === outcome(game.homeScore, game.awayScore)) {
    return 10;
  }

  if (bet.homeScore === game.awayScore && bet.awayScore === game.homeScore) {
    return 5;
  }

  return 0;
}

async function recalculateBetsForGame(gameId) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { bets: true }
  });

  if (!game) return { updated: 0 };

  let updated = 0;

  for (const bet of game.bets) {
    const points = calculatePoints(bet, game);
    if (bet.points !== points) {
      await prisma.bet.update({
        where: { id: bet.id },
        data: { points }
      });
      updated += 1;
    }
  }

  return { updated };
}

module.exports = {
  calculatePoints,
  recalculateBetsForGame
};
