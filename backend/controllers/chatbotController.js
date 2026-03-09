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
import { generateImageEmbedding, imageEmbeddingsConfig } from "../langchain/config/embeddings.js";
import { searchProducts } from "../langchain/tools/buyerTools.js";
import { detectImageLabels, visionLabelsConfig } from "../langchain/services/visionLabelService.js";
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
 * Send a message (with optional image) to the chatbot.
 * Accepts multipart/form-data or application/json.
 */
export async function sendMessage(req, res) {
  try {
    const message = req.body?.message;
    const currentPage = req.body?.currentPage;

    const hasImage = !!req.file;

    if ((!message || typeof message !== "string") && !hasImage) {
      return res.status(400).json({ 
        error: "A text message or image is required" 
      });
    }

    if (message && message.length > 2000) {
      return res.status(400).json({ 
        error: "Message too long. Maximum 2000 characters." 
      });
    }

    const sessionId = getSessionId(req);

    const userContext = {
      userId: req.user?.id || null,
      username: req.user?.name || "Guest",
      location: req.user?.campus_location_name || "UCR Campus",
      currentPage: currentPage || "unknown",
      isLoggedIn: !!req.user,
    };

    // If an image was uploaded, try a fast Vision-label search first,
    // then fall back to Vertex image embeddings if needed.
    let imageEmbedding = null;
    let imageSearch = null; // { source, query, labels, products }

    if (hasImage) {
      const imageBuffer = req.file.buffer;

      if (visionLabelsConfig.enabled) {
        try {
          const labels = await detectImageLabels({ imageBuffer });

          const minTopScore = Number.parseFloat(process.env.VISION_MIN_TOP_LABEL_SCORE || "0.5");
          const minLabelScore = Number.parseFloat(process.env.VISION_MIN_LABEL_SCORE || "0.4");
          const minLabels = Number.parseInt(process.env.VISION_MIN_LABELS || "2", 10);

          //this is to prioritize quickness over accuracy so keeping it lower is probably best since thats what we're using vision for
          const maxLabelsForQuery = Number.parseInt(process.env.VISION_MAX_LABELS_FOR_QUERY || "5", 10);

          //probably increase this john when more listings are available
          const minProducts = Number.parseInt(process.env.VISION_MIN_PRODUCTS || "1", 10);

          const topScore = labels[0]?.score ?? 0;
          const strongLabels = labels
            .filter((l) => (l.score ?? 0) >= minLabelScore && !!l.description)
            .slice(0, maxLabelsForQuery);

          const confidentEnough = topScore >= minTopScore && strongLabels.length >= minLabels;

          if (confidentEnough) {
            const labelQuery = strongLabels.map((l) => l.description).join(" ");
            const text = typeof message === "string" ? message.trim() : "";
            const combinedQuery = (text ? `${text} ${labelQuery}` : labelQuery).slice(0, 300);

            const raw = await searchProducts.invoke({ query: combinedQuery, limit: 5 });
            const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
            const products = parsed?.found ? parsed?.products : null;

            if (Array.isArray(products) && products.length >= minProducts) {
              imageSearch = {
                source: "vision-labels",
                query: combinedQuery,
                labels: strongLabels,
                products,
              };
            }
          }
        } catch (err) {
          console.error("Vision label search failed:", err);
        }
      }
      //fall back on vertex ai if vision labels fails, this the original code type sh
      if (!imageSearch && imageEmbeddingsConfig.enabled) {
        try {
          imageEmbedding = await generateImageEmbedding({ imageBuffer });
        } catch (err) {
          console.error("Image embedding generation failed:", err);
          // Continue without embedding; the agent can still respond to text
        }
      }
    }

    const response = await processMessage({
      sessionId,
      message: message || "Find products similar to this image",
      userContext,
      imageEmbedding,
      imageSearch,
      hasImage,
    });

    res.json({
      ...response,
      sessionId,
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

