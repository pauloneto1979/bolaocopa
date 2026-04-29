const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const gameRoutes = require("./routes/game.routes");
const betRoutes = require("./routes/bet.routes");
const teamRoutes = require("./routes/team.routes");
const groupRoutes = require("./routes/group.routes");
const poolRoutes = require("./routes/pool.routes");
const rankingRoutes = require("./routes/ranking.routes");
const prizeRoutes = require("./routes/prize.routes");
const { errorHandler } = require("./middlewares/errorHandler");
const { success } = require("./utils/response");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/", (req, res) => {
  return res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.get("/health", (req, res) => {
  return success(res, { app: "BolaoCopa", status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/pools", poolRoutes);
app.use("/users", userRoutes);
app.use("/groups", groupRoutes);
app.use("/teams", teamRoutes);
app.use("/games", gameRoutes);
app.use("/bets", betRoutes);
app.use("/ranking", rankingRoutes);
app.use("/prizes", prizeRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: "Rota nao encontrada." }
  });
});

app.use(errorHandler);

module.exports = app;
