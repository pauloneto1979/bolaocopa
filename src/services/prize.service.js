const prisma = require("../config/prisma");
const poolService = require("./pool.service");
const rankingService = require("./ranking.service");

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

async function calculatePrizes(poolId) {
  const pool = await poolService.resolvePool(poolId);
  const ranking = await rankingService.getRanking(pool.id);
  const participants = await prisma.poolMember.findMany({
    where: { poolId: pool.id, status: "ACTIVE" }
  });
  const usersCount = participants.length;
  const totalCollected = roundMoney(
    participants.reduce((sum, participant) => sum + Number(participant.entryValue), 0)
  );

  await prisma.prize.deleteMany({
    where: { poolId: pool.id }
  });

  if (!ranking.length) {
    return {
      poolId: pool.id,
      totalCollected,
      prizes: [],
      rule: "Sem usuarios cadastrados."
    };
  }

  const firstPoints = ranking[0].totalPoints;
  const firstPlaceUsers = ranking.filter(item => item.totalPoints === firstPoints);
  let calculated = [];
  let rule;

  if (firstPlaceUsers.length > 1) {
    const amount = roundMoney(totalCollected / firstPlaceUsers.length);
    calculated = firstPlaceUsers.map(user => ({
      poolId: pool.id,
      userId: user.userId,
      position: 1,
      amount
    }));
    rule = "Empate no primeiro lugar: 100% dividido entre os empatados.";
  } else {
    const secondPlace = ranking.find(item => item.totalPoints < firstPoints);
    calculated = [
      {
        poolId: pool.id,
        userId: ranking[0].userId,
        position: 1,
        amount: roundMoney(totalCollected * 0.9)
      }
    ];

    if (secondPlace) {
      calculated.push({
        poolId: pool.id,
        userId: secondPlace.userId,
        position: 2,
        amount: roundMoney(totalCollected * 0.1)
      });
    }

    rule = "Primeiro colocado recebe 90% e segundo colocado recebe 10%.";
  }

  const prizes = [];
  for (const prize of calculated) {
    prizes.push(
      await prisma.prize.create({
        data: prize,
        include: { user: true }
      })
    );
  }

  return {
    poolId: pool.id,
    usersCount,
    totalCollected,
    rule,
    prizes: prizes.map(prize => ({
      userId: prize.userId,
      name: prize.user.name,
      position: prize.position,
      amount: Number(prize.amount)
    }))
  };
}

module.exports = {
  calculatePrizes
};
