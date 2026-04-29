const { Router } = require("express");
const groupController = require("../controllers/group.controller");

const router = Router();

router.post("/", groupController.create);
router.get("/", groupController.list);
router.put("/:id", groupController.update);
router.delete("/:id", groupController.remove);

module.exports = router;
