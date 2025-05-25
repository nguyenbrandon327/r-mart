import express from "express";
import { protectRoute } from "../utils/protectRoute.js";
import { upload } from "../utils/s3.js";
import {
  getUserProfile,
  updateUserProfile,
  uploadProfilePic,
  deleteProfilePic,
  getUserByUsername
} from "../controllers/userController.js";

const router = express.Router();

// Get current user's profile
router.get("/profile", protectRoute, getUserProfile);

// Get user by username (public but requires auth)
router.get("/by-username/:username", protectRoute, getUserByUsername);

// Update user profile (name, description)
router.put("/profile", protectRoute, updateUserProfile);

// Upload profile picture
router.post("/profile-pic", protectRoute, upload.single('profilePic'), uploadProfilePic);

// Delete profile picture
router.delete("/profile-pic", protectRoute, deleteProfilePic);

export default router; 