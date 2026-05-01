const { Router } = require("express");
const poolController = require("../controllers/pool.controller");
const { requireAuth, requirePoolRole } = require("../middlewares/auth");

const router = Router();

router.post("/", requireAuth, poolController.create);
router.get("/", requireAuth, poolController.list);
router.put("/:id", requireAuth, requirePoolRole(["OWNER"], { poolIdFrom: req => req.params.id }), poolController.update);
router.delete("/:id", requireAuth, requirePoolRole(["OWNER"], { poolIdFrom: req => req.params.id }), poolController.remove);

module.exports = router;
