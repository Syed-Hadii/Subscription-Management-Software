const express = require("express");
const adminRouter = express.Router();
const authController = require("../controllers/adminController");
const { authMiddleware } = require("../middleware/auth.middleware");

adminRouter.post("/login", authController.login);
adminRouter.post("/forgot-password", authController.forgotPassword);
adminRouter.post("/reset-password", authController.resetPassword);
adminRouter.get("/verify", authMiddleware, (req, res) => {
    res.json({ msg: "Token is valid" });
});

module.exports = adminRouter;