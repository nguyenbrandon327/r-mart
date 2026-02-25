/**
 * Chatbot Routes
 * API routes for the AI chatbot functionality
 */

import express from "express";
import multer from "multer";
import {
  sendMessage,
  getHistory,
  clearHistory,
  endChatSession,
  getStats,
  quickPriceEstimateEndpoint,
  quickSearchEndpoint,
  quickPriceCheckEndpoint,
  quickScamCheckEndpoint,
  quickHelpEndpoint,
} from "../controllers/chatbotController.js";
import { checkAuth } from "../utils/checkAuth.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// ============================================
// Main Chatbot Endpoints
// ============================================

/**
 * POST /api/chatbot/message
 * Send a message (with optional image) to the chatbot.
 * Accepts multipart/form-data (image + fields) or application/json (text-only).
 */
router.post("/message", checkAuth, upload.single("image"), sendMessage);

/**
 * GET /api/chatbot/history
 * Get chat history for current session
 * Auth: Optional
 */
router.get("/history", checkAuth, getHistory);

/**
 * POST /api/chatbot/clear
 * Clear chat history for current session
 * Auth: Optional
 */
router.post("/clear", checkAuth, clearHistory);

/**
 * POST /api/chatbot/end
 * End the current chat session
 * Auth: Optional
 */
router.post("/end", checkAuth, endChatSession);

/**
 * GET /api/chatbot/stats
 * Get chatbot statistics (for monitoring)
 * Auth: Should be admin-only in production
 */
router.get("/stats", getStats);

// ============================================
// Quick Action Endpoints
// These don't require conversation context
// ============================================

/**
 * POST /api/chatbot/quick/price-estimate
 * Quick price estimation for an item
 * Body: { itemName, category, condition }
 */
router.post("/quick/price-estimate", quickPriceEstimateEndpoint);

/**
 * POST /api/chatbot/quick/search
 * Quick product search
 * Body: { query, category?, maxPrice? }
 */
router.post("/quick/search", quickSearchEndpoint);

/**
 * POST /api/chatbot/quick/price-check
 * Check if a product's price is fair
 * Body: { productId }
 */
router.post("/quick/price-check", quickPriceCheckEndpoint);

/**
 * POST /api/chatbot/quick/scam-check
 * Analyze text for scam indicators
 * Body: { text, context? }
 */
router.post("/quick/scam-check", quickScamCheckEndpoint);

/**
 * GET /api/chatbot/quick/help/:topic
 * Get help for a specific topic
 * Params: topic (creating_listing, buying, messaging, account, safety)
 */
router.get("/quick/help/:topic", quickHelpEndpoint);

export default router;

