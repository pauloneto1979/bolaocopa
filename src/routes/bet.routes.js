const { Router } = require("express");
const betController = require("../controllers/bet.controller");

const router = Router();

router.post("/", betController.create);
router.get("/", betController.list);
router.get("/user/:id", betController.listByUser);
router.put("/:id", betController.update);
router.delete("/:id", betController.remove);

module.exports = router;
