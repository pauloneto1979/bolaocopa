const axios = require("axios");
const AppError = require("../utils/AppError");

function apiClient() {
  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey || apiKey === "sua_chave_aqui") {
    throw new AppError("Configure API_FOOTBALL_KEY no arquivo .env.", 500);
  }

  return axios.create({
    baseURL: process.env.API_FOOTBALL_BASE_URL || "https://v3.football.api-sports.io",
    headers: {
      "x-apisports-key": apiKey
    },
    timeout: 20000
  });
}

function mapStatus(shortStatus) {
  if (["FT", "AET", "PEN"].includes(shortStatus)) return "FINISHED";
  if (["1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT"].includes(shortStatus)) return "LIVE";
  if (["CANC", "ABD", "AWD", "WO"].includes(shortStatus)) return "CANCELLED";
  return "SCHEDULED";
}

function normalizeFixture(item) {
  return {
    externalId: String(item.fixture.id),
    homeTeam: item.teams.home.name,
    awayTeam: item.teams.away.name,
    gameDate: new Date(item.fixture.date),
    homeScore: item.goals.home,
    awayScore: item.goals.away,
    status: mapStatus(item.fixture.status.short)
  };
}

async function fetchWorldCupFixtures() {
  const league = process.env.API_FOOTBALL_LEAGUE_ID;
  const season = process.env.API_FOOTBALL_SEASON;

  if (!league || !season) {
    throw new AppError("Configure API_FOOTBALL_LEAGUE_ID e API_FOOTBALL_SEASON no .env.", 500);
  }

  const response = await apiClient().get("/fixtures", {
    params: { league, season }
  });

  return (response.data.response || []).map(normalizeFixture);
}

module.exports = {
  fetchWorldCupFixtures
};
