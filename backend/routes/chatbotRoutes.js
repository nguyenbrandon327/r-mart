/**
 * Chatbot Routes
 * API routes for the AI chatbot functionality
 */

import express from "express";
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

// ============================================
// Main Chatbot Endpoints
// ============================================

/**
 * POST /api/chatbot/message
 * Send a message to the chatbot
 * Auth: Optional (enhances context if logged in)
 */
router.post("/message", checkAuth, sendMessage);

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

