const { Router } = require("express");
const rankingController = require("../controllers/ranking.controller");
const { requireAuth, requirePoolRole } = require("../middlewares/auth");

const router = Router();

router.get("/", requireAuth, requirePoolRole(["OWNER", "ADMIN", "USER"]), rankingController.get);

module.exports = router;
