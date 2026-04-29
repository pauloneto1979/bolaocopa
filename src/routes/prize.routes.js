const { Router } = require("express");
const prizeController = require("../controllers/prize.controller");

const router = Router();

router.get("/", prizeController.get);

module.exports = router;
