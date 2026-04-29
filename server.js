require("dotenv").config();

const app = require("./src/app");
const { startSyncGamesJob } = require("./src/jobs/syncGames.job");

const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(`BolaoCopa API rodando em http://localhost:${port}`);
  startSyncGamesJob();
});
