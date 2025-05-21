import express from "express";
import { 
  saveProduct,
  unsaveProduct,
  getSavedProducts,
  isProductSaved
} from "../controllers/savedProductController.js";
import { protectRoute } from "../utils/protectRoute.js";

const router = express.Router();

// All routes require authentication
router.use(protectRoute);

// Get all saved products for the authenticated user
router.get("/", getSavedProducts);

// Check if a product is saved by the user
router.get("/:productId/check", isProductSaved);

// Save a product
router.post("/", saveProduct);

// Unsave/remove a product
router.delete("/:productId", unsaveProduct);

export default router; 