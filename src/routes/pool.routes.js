const { Router } = require("express");
const poolController = require("../controllers/pool.controller");

const router = Router();

router.post("/", poolController.create);
router.get("/", poolController.list);
router.put("/:id", poolController.update);
router.delete("/:id", poolController.remove);

module.exports = router;
