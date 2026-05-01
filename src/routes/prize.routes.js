const { Router } = require("express");
const prizeController = require("../controllers/prize.controller");
const { requireAuth, requirePoolRole } = require("../middlewares/auth");

const router = Router();

router.get("/", requireAuth, requirePoolRole(["OWNER", "ADMIN", "USER"]), prizeController.get);

module.exports = router;
