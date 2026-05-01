const { Router } = require("express");
const userController = require("../controllers/user.controller");
const { requireAuth, requirePoolRole } = require("../middlewares/auth");

const router = Router();

router.post("/accounts", requireAuth, requirePoolRole(["OWNER", "ADMIN"]), userController.createAccount);
router.get("/accounts", requireAuth, requirePoolRole(["OWNER", "ADMIN"]), userController.listAccounts);
router.put("/accounts/:id", requireAuth, requirePoolRole(["OWNER", "ADMIN"]), userController.updateAccount);
router.delete("/accounts/:id", requireAuth, requirePoolRole(["OWNER", "ADMIN"]), userController.removeAccount);
router.post("/", requireAuth, requirePoolRole(["OWNER", "ADMIN"]), userController.create);
router.get("/", requireAuth, requirePoolRole(["OWNER", "ADMIN"]), userController.list);
router.put("/:id", requireAuth, requirePoolRole(["OWNER", "ADMIN"]), userController.update);
router.delete("/:id", requireAuth, requirePoolRole(["OWNER", "ADMIN"]), userController.remove);

module.exports = router;
