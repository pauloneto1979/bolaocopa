const { Router } = require("express");
const userController = require("../controllers/user.controller");

const router = Router();

router.post("/", userController.create);
router.get("/", userController.list);
router.put("/:id", userController.update);
router.delete("/:id", userController.remove);

module.exports = router;
