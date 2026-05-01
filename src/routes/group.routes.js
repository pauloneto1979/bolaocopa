const { Router } = require("express");
const groupController = require("../controllers/group.controller");
const { requireAuth, requirePoolRole } = require("../middlewares/auth");

const router = Router();

router.post("/", requireAuth, requirePoolRole(["OWNER", "ADMIN"]), groupController.create);
router.get("/", requireAuth, requirePoolRole(["OWNER", "ADMIN", "USER"]), groupController.list);
router.put("/:id", requireAuth, requirePoolRole(["OWNER", "ADMIN"]), groupController.update);
router.delete("/:id", requireAuth, requirePoolRole(["OWNER", "ADMIN"]), groupController.remove);

module.exports = router;
