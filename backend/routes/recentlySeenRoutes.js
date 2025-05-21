import express from "express";
import { 
    getRecentlyViewedProducts, 
    clearRecentlyViewedProducts
} from "../controllers/recentlySeenController.js";
import { protectRoute } from "../utils/protectRoute.js";

const router = express.Router();

// All routes require authentication
router.use(protectRoute);

// Get all recently viewed products for the current user
router.get("/", getRecentlyViewedProducts);

// Clear all recently viewed products for the current user
router.delete("/clear", clearRecentlyViewedProducts);

export default router; 