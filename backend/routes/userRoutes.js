import express from "express";
import { protectRoute } from "../utils/protectRoute.js";
import { upload } from "../utils/s3.js";
import {
  getUserProfile,
  updateUserProfile,
  uploadProfilePic,
  deleteProfilePic,
  getUserByUsername,
  updateOnboardingStep1,
  completeOnboarding,
  completeOnboardingAll,
  updateUserLocation,
  geocodeAddress
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

// Onboarding routes
router.put("/onboarding/step1", protectRoute, updateOnboardingStep1);
router.put("/onboarding/complete", protectRoute, completeOnboarding);
router.put("/onboarding", protectRoute, completeOnboardingAll);

// Location routes
router.put("/location", protectRoute, updateUserLocation);

// Geocoding route
router.post("/geocode", protectRoute, geocodeAddress);

export default router; 