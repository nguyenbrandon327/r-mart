/**
 * Chatbot Service
 * Main orchestrator that handles incoming messages and routes them to appropriate agents
 */

import { smartRoute, AGENT_TYPES } from "../agents/routerAgent.js";
import { processSellerMessage } from "../agents/sellerAgent.js";
import { processBuyerMessage } from "../agents/buyerAgent.js";
import { processSupportMessage } from "../agents/supportAgent.js";

/**
 * In-memory chat session storage
 * In production, consider using Redis or database storage
 */
const chatSessions = new Map();

/**
 * Session TTL in milliseconds (30 minutes)
 */
const SESSION_TTL = 30 * 60 * 1000;

/**
 * Maximum messages to keep in history per session
 */
const MAX_HISTORY_LENGTH = 20;

/**
 * Get or create a chat session
 * @param {string} sessionId - Unique session identifier
 * @returns {Object} Chat session
 */
function getSession(sessionId) {
  if (!chatSessions.has(sessionId)) {
    chatSessions.set(sessionId, {
      id: sessionId,
      history: [],
      userContext: {},
      lastAgent: null,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    });
  }

  const session = chatSessions.get(sessionId);
  session.lastActivity = Date.now();
  return session;
}

/**
 * Clean up expired sessions
 */
function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [sessionId, session] of chatSessions) {
    if (now - session.lastActivity > SESSION_TTL) {
      chatSessions.delete(sessionId);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredSessions, 5 * 60 * 1000);

/**
 * Add a message to session history
 * @param {Object} session - Chat session
 * @param {string} role - Message role (user or assistant)
 * @param {string} content - Message content
 */
function addToHistory(session, role, content) {
  session.history.push({
    role,
    content,
    timestamp: Date.now(),
  });

  // Trim history if too long
  if (session.history.length > MAX_HISTORY_LENGTH) {
    session.history = session.history.slice(-MAX_HISTORY_LENGTH);
  }
}

/**
 * Process a chatbot message
 * @param {Object} params - Message parameters
 * @param {string} params.sessionId - Session identifier
 * @param {string} params.message - User's message
 * @param {Object} params.userContext - User context (user info, current page, etc.)
 * @param {number[]|null} params.imageEmbedding - Optional 1408-dim image embedding
 * @param {Object|null} params.imageSearch - Optional precomputed image-search payload (e.g. Vision-label search)
 * @param {boolean} params.hasImage - Whether an image was uploaded
 * @returns {Promise<Object>} Chatbot response
 */
export async function processMessage({
  sessionId,
  message,
  userContext = {},
  imageEmbedding = null,
  imageSearch = null,
  hasImage = false,
}) {
  try {
    const session = getSession(sessionId);
    
    session.userContext = {
      ...session.userContext,
      ...userContext,
    };

    addToHistory(session, "user", message);

    // If the user uploaded an image, prefer buyer/seller image-aware agents
    let agentType;
    //if vision already used to get image labels
    const hasPrecomputedImageSearch =
      !!imageSearch && Array.isArray(imageSearch.products) && imageSearch.products.length > 0;

    if (hasImage && (imageEmbedding || hasPrecomputedImageSearch)) {
      // Let the router decide first; if it explicitly chooses SELLER_COPILOT,
      // honor that, otherwise default to BUYER_ASSISTANT for visual search.
      const routed = await smartRoute({
        input: message,
        isLoggedIn: !!userContext.userId,
        currentPage: userContext.currentPage || "unknown",
      });
      if (routed === AGENT_TYPES.SELLER_COPILOT) {
        agentType = AGENT_TYPES.SELLER_COPILOT;
        console.log("[Router] Image detected – routing to SELLER_COPILOT with image context");
      } else {
        agentType = AGENT_TYPES.BUYER_ASSISTANT;
        console.log("[Router] Image detected – routing to BUYER_ASSISTANT for visual search");
      }
    } else {
      agentType = await smartRoute({
        input: message,
        isLoggedIn: !!userContext.userId,
        currentPage: userContext.currentPage || "unknown",
      });
    }

    session.lastAgent = agentType;

    let response;
    
    switch (agentType) {
      case AGENT_TYPES.SELLER_COPILOT:
        response = await processSellerMessage({
          input: message,
          chatHistory: session.history.slice(-10),
          userContext: session.userContext,
          imageEmbedding,
          imageSearch,
        });
        break;

      case AGENT_TYPES.BUYER_ASSISTANT:
        response = await processBuyerMessage({
          input: message,
          chatHistory: session.history.slice(-10),
          userContext: session.userContext,
          imageEmbedding,
          imageSearch,
        });
        break;

      case AGENT_TYPES.SUPPORT_SECURITY:
      default:
        response = await processSupportMessage({
          input: message,
          chatHistory: session.history.slice(-10),
          userContext: session.userContext,
        });
        break;
    }

    addToHistory(session, "assistant", response.output);

    return {
      success: response.success,
      message: response.output,
      agent: agentType,
      sessionId,
      timestamp: Date.now(),
      ...(process.env.NODE_ENV === "development" && {
        debug: {
          intermediateSteps: response.intermediateSteps,
          historyLength: session.history.length,
        },
      }),
    };
  } catch (error) {
    console.error("Error processing chatbot message:", error);
    
    return {
      success: false,
      message: "I'm sorry, I encountered an error processing your message. Please try again.",
      error: error.message,
      sessionId,
      timestamp: Date.now(),
    };
  }
}

/**
 * Get chat history for a session
 * @param {string} sessionId - Session identifier
 * @returns {Array} Chat history
 */
export function getChatHistory(sessionId) {
  const session = chatSessions.get(sessionId);
  return session ? session.history : [];
}

/**
 * Clear chat history for a session
 * @param {string} sessionId - Session identifier
 */
export function clearChatHistory(sessionId) {
  const session = chatSessions.get(sessionId);
  if (session) {
    session.history = [];
    session.lastAgent = null;
  }
}

/**
 * End a chat session
 * @param {string} sessionId - Session identifier
 */
export function endSession(sessionId) {
  chatSessions.delete(sessionId);
}

/**
 * Get session stats (for debugging/monitoring)
 * @returns {Object} Session statistics
 */
export function getSessionStats() {
  return {
    activeSessions: chatSessions.size,
    sessions: Array.from(chatSessions.values()).map((s) => ({
      id: s.id,
      messageCount: s.history.length,
      lastAgent: s.lastAgent,
      lastActivity: new Date(s.lastActivity).toISOString(),
    })),
  };
}

export default {
  processMessage,
  getChatHistory,
  clearChatHistory,
  endSession,
  getSessionStats,
};

