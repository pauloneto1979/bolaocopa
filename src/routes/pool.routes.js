const { Router } = require("express");
const poolController = require("../controllers/pool.controller");
const { requireAuth, requirePoolRole } = require("../middlewares/auth");

const router = Router();

router.post("/", requireAuth, poolController.create);
router.get("/", requireAuth, poolController.list);
router.put("/:id", requireAuth, requirePoolRole(["OWNER"], { poolIdFrom: req => req.params.id }), poolController.update);
router.put("/:id/close", requireAuth, requirePoolRole(["OWNER"], { poolIdFrom: req => req.params.id }), poolController.close);
router.put("/:id/reopen", requireAuth, requirePoolRole(["OWNER"], { poolIdFrom: req => req.params.id }), poolController.reopen);
router.delete("/:id", requireAuth, requirePoolRole(["OWNER"], { poolIdFrom: req => req.params.id }), poolController.remove);

module.exports = router;
