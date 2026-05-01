const { Router } = require("express");
const teamController = require("../controllers/team.controller");
const { requireAuth, requirePoolRole } = require("../middlewares/auth");

const router = Router();

router.post("/", requireAuth, requirePoolRole(["OWNER", "ADMIN"]), teamController.create);
router.get("/", requireAuth, requirePoolRole(["OWNER", "ADMIN", "USER"]), teamController.list);
router.put("/:id", requireAuth, requirePoolRole(["OWNER", "ADMIN"]), teamController.update);
router.delete("/:id", requireAuth, requirePoolRole(["OWNER", "ADMIN"]), teamController.remove);

module.exports = router;
