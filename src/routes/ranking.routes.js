const { Router } = require("express");
const rankingController = require("../controllers/ranking.controller");

const router = Router();

router.get("/", rankingController.get);

module.exports = router;
