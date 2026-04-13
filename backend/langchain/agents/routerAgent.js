/**
 * Router Agent
 * Analyzes user intent and routes to the appropriate specialized agent
 */

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { routerLLM } from "../config/llm.js";
import { ROUTER_SYSTEM_PROMPT, ROUTER_HUMAN_PROMPT } from "../prompts/routerPrompt.js";

// Valid agent types
export const AGENT_TYPES = {
  SELLER_COPILOT: "SELLER_COPILOT",
  BUYER_ASSISTANT: "BUYER_ASSISTANT",
  SUPPORT_SECURITY: "SUPPORT_SECURITY",
};

/**
 * Create the router chain
 */
const routerPrompt = ChatPromptTemplate.fromMessages([
  ["system", ROUTER_SYSTEM_PROMPT],
  ["human", ROUTER_HUMAN_PROMPT],
]);

const routerChain = routerPrompt.pipe(routerLLM).pipe(new StringOutputParser());

/**
 * Route a message to the appropriate agent
 * @param {Object} params - Routing parameters
 * @param {string} params.input - User's message
 * @param {boolean} params.isLoggedIn - Whether user is logged in
 * @param {string} params.currentPage - Current page the user is on
 * @returns {Promise<string>} The agent type to handle this request
 */
export async function routeMessage({ input, isLoggedIn = false, currentPage = "unknown" }) {
  try {
    const result = await routerChain.invoke({
      input,
      isLoggedIn: isLoggedIn ? "Yes" : "No",
      currentPage,
    });

    // Clean up the response and validate
    const cleanedResult = result.trim().toUpperCase();
    
    // Check if it's a valid agent type
    if (Object.values(AGENT_TYPES).includes(cleanedResult)) {
      return cleanedResult;
    }

    // If we can't parse the result, check for keywords
    if (cleanedResult.includes("SELLER")) {
      return AGENT_TYPES.SELLER_COPILOT;
    }
    if (cleanedResult.includes("BUYER")) {
      return AGENT_TYPES.BUYER_ASSISTANT;
    }

    // Default to support for anything unclear
    return AGENT_TYPES.SUPPORT_SECURITY;
  } catch (error) {
    console.error("Error in router agent:", error);
    // Default to support on error
    return AGENT_TYPES.SUPPORT_SECURITY;
  }
}

/**
 * Quick route based on keywords (faster, no LLM call)
 * Use this for obvious cases to save API calls
 * @param {string} input - User's message
 * @returns {string|null} Agent type if obvious, null if LLM routing needed
 */
export function quickRoute(input) {
  const lowerInput = input.toLowerCase();

  // Seller keywords
  const sellerKeywords = [
    "sell", "selling", "list", "listing", "create listing", "post",
    "price my", "how much should i", "worth", "value",
    "draft", "description for my"
  ];
  
  // Buyer keywords
  const buyerKeywords = [
    "buy", "looking for", "find", "search", "where can i get",
    "show me", "compare", "recommend", "under $", "budget",
    "similar to", "like this",
    "image", "photo", "picture", "uploaded"
  ];

  // Support/Security keywords
  const supportKeywords = [
    "help", "how do i", "what is", "policy", "terms", "privacy",
    "scam", "safe", "report", "suspicious", "trust",
    "account", "settings"
  ];

  // Check for matches
  const sellerMatch = sellerKeywords.some(kw => lowerInput.includes(kw));
  const buyerMatch = buyerKeywords.some(kw => lowerInput.includes(kw));
  const supportMatch = supportKeywords.some(kw => lowerInput.includes(kw));

  // Only return if there's a clear single match
  const matches = [sellerMatch, buyerMatch, supportMatch].filter(Boolean).length;
  
  if (matches === 1) {
    if (sellerMatch) return AGENT_TYPES.SELLER_COPILOT;
    if (buyerMatch) return AGENT_TYPES.BUYER_ASSISTANT;
    if (supportMatch) return AGENT_TYPES.SUPPORT_SECURITY;
  }

  // Ambiguous or no match - need LLM routing
  return null;
}

/**
 * Smart routing - tries quick route first, falls back to LLM
 * @param {Object} params - Routing parameters
 * @returns {Promise<string>} The agent type to handle this request
 */
export async function smartRoute(params) {
  // Try quick route first
  const quickResult = quickRoute(params.input);
  if (quickResult) {
    console.log(`[Router] Quick routed to: ${quickResult}`);
    return quickResult;
  }

  // Fall back to LLM routing
  console.log("[Router] Using LLM for routing...");
  const llmResult = await routeMessage(params);
  console.log(`[Router] LLM routed to: ${llmResult}`);
  return llmResult;
}

export default {
  routeMessage,
  quickRoute,
  smartRoute,
  AGENT_TYPES,
};

