import express from "express";
import { login, logout, signup, verifyEmail, forgotPassword, resetPassword, checkAuth, resendVerificationCode } from "../controllers/authController.js";
import { protectRoute } from "../utils/protectRoute.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification-code", protectRoute, resendVerificationCode);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/check-auth", protectRoute, checkAuth);

export default router;
