const cron = require("node-cron");
const gameService = require("../services/game.service");

let started = false;

function startSyncGamesJob() {
  if (started) return;
  started = true;

  if (!process.env.API_FOOTBALL_KEY || process.env.API_FOOTBALL_KEY === "sua_chave_aqui") {
    console.log("[sync-games-job] API_FOOTBALL_KEY nao configurada. Job automatico pausado.");
    return;
  }

  cron.schedule("*/5 * * * *", async () => {
    try {
      const result = await gameService.syncGames();
      console.log("[sync-games-job]", result);
    } catch (error) {
      console.error("[sync-games-job]", error.message);
    }
  });
}

module.exports = {
  startSyncGamesJob
};
