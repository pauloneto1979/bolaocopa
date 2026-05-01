const { Router } = require("express");
const memberController = require("../controllers/member.controller");
const { requirePoolRole } = require("../middlewares/auth");

const router = Router({ mergeParams: true });

router.get("/", requirePoolRole(["OWNER", "ADMIN"]), memberController.list);
router.post("/", requirePoolRole(["OWNER"]), memberController.create);
router.put("/:memberId", requirePoolRole(["OWNER"]), memberController.update);
router.delete("/:memberId", requirePoolRole(["OWNER"]), memberController.remove);

module.exports = router;
