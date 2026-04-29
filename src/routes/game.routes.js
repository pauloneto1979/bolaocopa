const { Router } = require("express");
const gameController = require("../controllers/game.controller");

const router = Router();

router.post("/sync", gameController.sync);
router.post("/", gameController.create);
router.get("/", gameController.list);
router.put("/:id", gameController.update);
router.delete("/:id", gameController.remove);
router.put("/:id/result", gameController.updateResult);

module.exports = router;
