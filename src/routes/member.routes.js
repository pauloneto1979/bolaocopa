const { Router } = require("express");
const memberController = require("../controllers/member.controller");
const { requireAuth, requirePoolRole } = require("../middlewares/auth");

const router = Router({ mergeParams: true });

router.get("/", requireAuth, requirePoolRole(["OWNER", "ADMIN"]), memberController.list);
router.post("/", requireAuth, requirePoolRole(["OWNER"]), memberController.create);
router.put("/:memberId", requireAuth, requirePoolRole(["OWNER"]), memberController.update);
router.delete("/:memberId", requireAuth, requirePoolRole(["OWNER"]), memberController.remove);

module.exports = router;
