/**
 * Chatbot Controller
 * Handles API endpoints for the AI chatbot
 */

import { 
  processMessage, 
  getChatHistory, 
  clearChatHistory, 
  endSession,
  getSessionStats 
} from "../langchain/services/chatbotService.js";
import { quickPriceEstimate } from "../langchain/agents/sellerAgent.js";
import { quickSearch, quickPriceCheck } from "../langchain/agents/buyerAgent.js";
import { quickScamCheck, quickHelp } from "../langchain/agents/supportAgent.js";
import crypto from "crypto";

/**
 * Generate a session ID for anonymous users
 */
function generateSessionId() {
  return `session_${crypto.randomBytes(16).toString("hex")}`;
}

/**
 * Get or create session ID from request
 */
function getSessionId(req) {
  // If user is logged in, use their user ID as part of session
  if (req.user?.id) {
    return `user_${req.user.id}`;
  }
  
  // Check for existing session ID in body or generate new one
  if (req.body?.sessionId) {
    return req.body.sessionId;
  }
  
  return generateSessionId();
}

/**
 * POST /api/chatbot/message
 * Send a message to the chatbot
 */
export async function sendMessage(req, res) {
  try {
    const { message, currentPage } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ 
        error: "Message is required and must be a string" 
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({ 
        error: "Message too long. Maximum 2000 characters." 
      });
    }

    const sessionId = getSessionId(req);

    // Build user context
    const userContext = {
      userId: req.user?.id || null,
      username: req.user?.name || "Guest",
      location: req.user?.campus_location_name || "UCR Campus",
      currentPage: currentPage || "unknown",
      isLoggedIn: !!req.user,
    };

    // Process the message
    const response = await processMessage({
      sessionId,
      message,
      userContext,
    });

    // Return the response with session ID for tracking
    res.json({
      ...response,
      sessionId, // Include so client can track session
    });
  } catch (error) {
    console.error("Error in sendMessage:", error);
    res.status(500).json({ 
      error: "Failed to process message",
      message: "I'm sorry, something went wrong. Please try again.",
    });
  }
}

/**
 * GET /api/chatbot/history
 * Get chat history for current session
 */
export async function getHistory(req, res) {
  try {
    const sessionId = getSessionId(req);
    const history = getChatHistory(sessionId);

    res.json({
      sessionId,
      history,
      count: history.length,
    });
  } catch (error) {
    console.error("Error in getHistory:", error);
    res.status(500).json({ error: "Failed to retrieve chat history" });
  }
}

/**
 * POST /api/chatbot/clear
 * Clear chat history for current session
 */
export async function clearHistory(req, res) {
  try {
    const sessionId = getSessionId(req);
    clearChatHistory(sessionId);

    res.json({
      success: true,
      message: "Chat history cleared",
      sessionId,
    });
  } catch (error) {
    console.error("Error in clearHistory:", error);
    res.status(500).json({ error: "Failed to clear chat history" });
  }
}

/**
 * POST /api/chatbot/end
 * End the current chat session
 */
export async function endChatSession(req, res) {
  try {
    const sessionId = getSessionId(req);
    endSession(sessionId);

    res.json({
      success: true,
      message: "Session ended",
    });
  } catch (error) {
    console.error("Error in endChatSession:", error);
    res.status(500).json({ error: "Failed to end session" });
  }
}

/**
 * GET /api/chatbot/stats (Admin only - for monitoring)
 * Get chatbot session statistics
 */
export async function getStats(req, res) {
  try {
    // In production, add admin authentication check here
    const stats = getSessionStats();

    res.json(stats);
  } catch (error) {
    console.error("Error in getStats:", error);
    res.status(500).json({ error: "Failed to retrieve stats" });
  }
}

// ============================================
// Quick Action Endpoints (No conversation needed)
// ============================================

/**
 * POST /api/chatbot/quick/price-estimate
 * Quick price estimation for an item
 */
export async function quickPriceEstimateEndpoint(req, res) {
  try {
    const { itemName, category, condition } = req.body;

    if (!itemName || !category || !condition) {
      return res.status(400).json({ 
        error: "itemName, category, and condition are required" 
      });
    }

    const result = await quickPriceEstimate({ itemName, category, condition });

    res.json(result);
  } catch (error) {
    console.error("Error in quickPriceEstimate:", error);
    res.status(500).json({ error: "Failed to estimate price" });
  }
}

/**
 * POST /api/chatbot/quick/search
 * Quick product search
 */
export async function quickSearchEndpoint(req, res) {
  try {
    const { query, category, maxPrice } = req.body;

    if (!query) {
      return res.status(400).json({ error: "query is required" });
    }

    const result = await quickSearch({ query, category, maxPrice });

    res.json(result);
  } catch (error) {
    console.error("Error in quickSearch:", error);
    res.status(500).json({ error: "Failed to search products" });
  }
}

/**
 * POST /api/chatbot/quick/price-check
 * Quick price fairness check for a product
 */
export async function quickPriceCheckEndpoint(req, res) {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }

    const result = await quickPriceCheck(productId);

    res.json(result);
  } catch (error) {
    console.error("Error in quickPriceCheck:", error);
    res.status(500).json({ error: "Failed to check price" });
  }
}

/**
 * POST /api/chatbot/quick/scam-check
 * Quick scam analysis for text
 */
export async function quickScamCheckEndpoint(req, res) {
  try {
    const { text, context } = req.body;

    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }

    const result = await quickScamCheck(text, context || "general");

    res.json(result);
  } catch (error) {
    console.error("Error in quickScamCheck:", error);
    res.status(500).json({ error: "Failed to analyze text" });
  }
}

/**
 * GET /api/chatbot/quick/help/:topic
 * Quick help for a topic
 */
export async function quickHelpEndpoint(req, res) {
  try {
    const { topic } = req.params;

    if (!topic) {
      return res.status(400).json({ error: "topic is required" });
    }

    const result = await quickHelp(topic);

    res.json(result);
  } catch (error) {
    console.error("Error in quickHelp:", error);
    res.status(500).json({ error: "Failed to get help" });
  }
}

export default {
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
};

