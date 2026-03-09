/**
 * Seller Copilot Agent
 * Helps users create listings, estimate prices, and optimize their selling experience
 * 
 * Uses a simple tool-calling approach compatible with Google Gemini
 */

import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { agentLLM } from "../config/llm.js";
import { SELLER_SYSTEM_PROMPT, SELLER_HUMAN_PROMPT } from "../prompts/sellerPrompt.js";
import { sellerTools } from "../tools/sellerTools.js";
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";

/**
 * Create the seller agent prompt
 */
const sellerPrompt = ChatPromptTemplate.fromMessages([
  ["system", SELLER_SYSTEM_PROMPT],
  new MessagesPlaceholder("chat_history"),
  ["human", SELLER_HUMAN_PROMPT],
]);

// Create LLM with tools bound
const sellerLLMWithTools = agentLLM.bindTools(sellerTools);

/**
 * Convert chat history array to LangChain message format
 * @param {Array} history - Chat history array [{role, content}]
 * @returns {Array} LangChain message objects
 */
function formatChatHistory(history = []) {
  return history.map((msg) => {
    if (msg.role === "user" || msg.role === "human") {
      return new HumanMessage(msg.content);
    } else {
      return new AIMessage(msg.content);
    }
  });
}

/**
 * Format chat history as a string (alternative format)
 * @param {Array} history - Chat history array [{role, content}]
 * @returns {string} Formatted chat history string
 */
function formatChatHistoryString(history = []) {
  if (!history || history.length === 0) {
    return "No previous messages.";
  }

  return history
    .map((msg) => {
      const role = msg.role === "user" ? "User" : "Assistant";
      return `${role}: ${msg.content}`;
    })
    .join("\n");
}

/**
 * Execute a tool by name
 * @param {string} toolName - Name of the tool to execute
 * @param {Object} toolInput - Input for the tool
 * @returns {Promise<string>} Tool result
 */
async function executeTool(toolName, toolInput) {
  const tool = sellerTools.find(t => t.name === toolName);
  if (!tool) {
    return JSON.stringify({ error: `Tool ${toolName} not found` });
  }
  try {
    const result = await tool.invoke(toolInput);
    return result;
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    return JSON.stringify({ error: error.message });
  }
}

/**
 * Process a message with the seller agent
 * @param {Object} params - Parameters
 * @param {string} params.input - User's message
 * @param {Array} params.chatHistory - Previous chat messages
 * @param {Object} params.userContext - User context (username, location, etc.)
 * @param {number[]|null} params.imageEmbedding - Optional image embedding (for image-based pricing/search)
 * @param {Object|null} params.imageSearch - Optional precomputed image-search payload (e.g. Vision-label search results)
 * @returns {Promise<Object>} Agent response
 */
export async function processSellerMessage({
  input,
  chatHistory = [],
  userContext = {},
  imageEmbedding = null,//no point for right now
  imageSearch = null,
}) {
  try {
    const intermediateSteps = [];

    let sellerImageContext = "No image was uploaded.";
    const precomputedProducts = imageSearch?.products;
    const visionLabels = Array.isArray(imageSearch?.labels)
      ? imageSearch.labels.map((l) => l.description).filter(Boolean)
      : [];

    // If we have products from Vision-based search, present them as similar items.
    if (Array.isArray(precomputedProducts) && precomputedProducts.length > 0) {
      const lines = precomputedProducts.slice(0, 5).map((p, i) => {
        const price = Number.isFinite(p.price) ? p.price : parseFloat(p.price);
        const category = p.category ?? "other";
        return `${i + 1}. ${p.name} — $${Number.isFinite(price) ? price.toFixed(2) : "0.00"} (${category})`;
      });

      const labelsLine =
        visionLabels.length > 0
          ? `\n\nVision thinks this image looks like (labels/logos): ${visionLabels.join(", ")}.`
          : "";

      sellerImageContext =
        "The user uploaded an image. These are similar items currently listed in the marketplace:\n" +
        lines.join("\n") +
        labelsLine +
        "\n\nUse these as reference points when suggesting categories, titles, and prices.";

      intermediateSteps.push({
        action: "imageSearch",
        input: { source: imageSearch?.source || "precomputed" },
        output: { count: precomputedProducts.length },
      });
    } else if (visionLabels.length > 0) {
      // We have labels/logos but no similar products; still surface them so the agent
      // can infer category/brand from the image.
      sellerImageContext =
        "The user uploaded an image. No similar items were found in the marketplace, " +
        "but Vision extracted the following labels/logos: " +
        visionLabels.join(", ") +
        ". Use these hints to infer the item type, brand, and category, then ask follow-up questions as needed.";

      intermediateSteps.push({
        action: "imageLabels",
        input: { labels: visionLabels },
        output: { count: visionLabels.length },
      });
    } else if (imageEmbedding) {
      // Embedding is available but seller tools aient got nothing to do with this johnson yet
      sellerImageContext =
        "The user uploaded an image and an image embedding is available for visual similarity search. " +
        "You can call tools that search similar listings or estimate price using the item details.";
      intermediateSteps.push({
        action: "imageEmbeddingAvailable",
        input: { embeddingLength: imageEmbedding.length },
        output: {},
      });
    }

    // Format the prompt
    const formattedPrompt = await sellerPrompt.formatMessages({
      input,
      chat_history: formatChatHistory(chatHistory),
      chatHistory: formatChatHistoryString(chatHistory),
      username: userContext.username || "Guest",
      location: userContext.location || "UCR Campus",
      sellerImageContext,
    });

    // Initial LLM call
    let response = await sellerLLMWithTools.invoke(formattedPrompt);
    
    // Agent loop - process tool calls if any
    let iterations = 0;
    const maxIterations = 5;
    
    while (response.tool_calls && response.tool_calls.length > 0 && iterations < maxIterations) {
      iterations++;
      
      // Execute all tool calls
      const toolMessages = [];
      for (const toolCall of response.tool_calls) {
        const toolResult = await executeTool(toolCall.name, toolCall.args);
        
        intermediateSteps.push({
          action: toolCall.name,
          input: toolCall.args,
          output: typeof toolResult === "string" ? JSON.parse(toolResult) : toolResult,
        });
        
        toolMessages.push(new ToolMessage({
          content: toolResult,
          tool_call_id: toolCall.id,
        }));
      }
      
      // Continue conversation with tool results
      const messagesWithTools = [
        ...formattedPrompt,
        response,
        ...toolMessages,
      ];
      
      response = await sellerLLMWithTools.invoke(messagesWithTools);
    }

    return {
      success: true,
      output: response.content,
      intermediateSteps,
    };
  } catch (error) {
    console.error("Error in seller agent:", error);
    return {
      success: false,
      error: error.message,
      output: "I apologize, but I encountered an error while processing your request. Please try again or rephrase your question.",
    };
  }
}

/**
 * Quick helper for price estimation without full agent
 * @param {Object} params - Price estimation parameters
 * @returns {Promise<Object>} Price estimate
 */
export async function quickPriceEstimate({ itemName, category, condition }) {
  const { estimatePrice } = await import("../tools/sellerTools.js");
  
  try {
    const result = await estimatePrice.invoke({
      itemName,
      category,
      condition,
    });
    return JSON.parse(result);
  } catch (error) {
    console.error("Error in quick price estimate:", error);
    throw error;
  }
}

export default {
  processSellerMessage,
  quickPriceEstimate,
};
