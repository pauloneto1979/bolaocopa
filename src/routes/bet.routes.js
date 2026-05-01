const { Router } = require("express");
const betController = require("../controllers/bet.controller");
const { requireAuth, requirePoolRole } = require("../middlewares/auth");

const router = Router();

router.post("/", requireAuth, requirePoolRole(["OWNER", "ADMIN", "USER"]), betController.create);
router.get("/", requireAuth, requirePoolRole(["OWNER", "ADMIN", "USER"]), betController.list);
router.get("/user/:id", requireAuth, requirePoolRole(["OWNER", "ADMIN", "USER"]), betController.listByUser);
router.put("/:id", requireAuth, requirePoolRole(["OWNER", "ADMIN", "USER"]), betController.update);
router.delete("/:id", requireAuth, requirePoolRole(["OWNER", "ADMIN", "USER"]), betController.remove);

module.exports = router;
