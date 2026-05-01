const { Router } = require("express");
const gameController = require("../controllers/game.controller");
const { requireAuth, requirePoolRole } = require("../middlewares/auth");

const router = Router();

router.post("/sync", requireAuth, requirePoolRole(["OWNER", "ADMIN"]), gameController.sync);
router.post("/", requireAuth, requirePoolRole(["OWNER", "ADMIN"]), gameController.create);
router.get("/", requireAuth, requirePoolRole(["OWNER", "ADMIN", "USER"]), gameController.list);
router.put("/:id", requireAuth, requirePoolRole(["OWNER", "ADMIN"]), gameController.update);
router.delete("/:id", requireAuth, requirePoolRole(["OWNER", "ADMIN"]), gameController.remove);
router.put("/:id/result", requireAuth, requirePoolRole(["OWNER", "ADMIN"]), gameController.updateResult);

module.exports = router;
