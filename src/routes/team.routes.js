const { Router } = require("express");
const teamController = require("../controllers/team.controller");

const router = Router();

router.post("/", teamController.create);
router.get("/", teamController.list);
router.put("/:id", teamController.update);
router.delete("/:id", teamController.remove);

module.exports = router;
