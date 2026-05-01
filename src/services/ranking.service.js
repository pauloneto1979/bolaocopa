const prisma = require("../config/prisma");
const poolService = require("./pool.service");

async function getRanking(poolId) {
  const pool = await poolService.resolvePool(poolId);

  const participants = await prisma.poolMember.findMany({
    where: { poolId: pool.id, status: "ACTIVE" },
    include: {
      user: {
        include: {
          bets: {
            where: { poolId: pool.id }
          }
        }
      }
    }
  });

  return participants
    .map(participant => ({
      userId: participant.user.id,
      name: participant.user.name,
      email: participant.user.email,
      totalPoints: participant.user.bets.reduce((sum, bet) => sum + bet.points, 0),
      betsCount: participant.user.bets.length
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name))
    .map((item, index) => ({
      position: index + 1,
      ...item
    }));
}

module.exports = {
  getRanking
};
