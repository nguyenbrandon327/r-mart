/**
 * Buyer Assistant Agent
 * Helps users find products, compare listings, and make informed purchases
 * 
 * Uses a simple tool-calling approach compatible with Google Gemini
 */

import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { agentLLM } from "../config/llm.js";
import { BUYER_SYSTEM_PROMPT, BUYER_HUMAN_PROMPT } from "../prompts/buyerPrompt.js";
import { buyerTools } from "../tools/buyerTools.js";
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";

/**
 * Create the buyer agent prompt
 */
const buyerPrompt = ChatPromptTemplate.fromMessages([
  ["system", BUYER_SYSTEM_PROMPT],
  new MessagesPlaceholder("chat_history"),
  ["human", BUYER_HUMAN_PROMPT],
]);

// Create LLM with tools bound
const buyerLLMWithTools = agentLLM.bindTools(buyerTools);

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
  const tool = buyerTools.find(t => t.name === toolName);
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
 * Process a message with the buyer agent
 * @param {Object} params - Parameters
 * @param {string} params.input - User's message
 * @param {Array} params.chatHistory - Previous chat messages
 * @param {Object} params.userContext - User context (username, location, search history)
 * @returns {Promise<Object>} Agent response
 */
export async function processBuyerMessage({ input, chatHistory = [], userContext = {} }) {
  try {
    const intermediateSteps = [];
    
    // Format the prompt
    const formattedPrompt = await buyerPrompt.formatMessages({
      input,
      chat_history: formatChatHistory(chatHistory),
      chatHistory: formatChatHistoryString(chatHistory),
      username: userContext.username || "Guest",
      location: userContext.location || "UCR Campus",
      searchHistory: userContext.searchHistory?.join(", ") || "None",
    });

    // Initial LLM call
    let response = await buyerLLMWithTools.invoke(formattedPrompt);
    
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
      
      response = await buyerLLMWithTools.invoke(messagesWithTools);
    }

    return {
      success: true,
      output: response.content,
      intermediateSteps,
    };
  } catch (error) {
    console.error("Error in buyer agent:", error);
    return {
      success: false,
      error: error.message,
      output: "I apologize, but I encountered an error while searching for products. Please try again or rephrase your search.",
    };
  }
}

/**
 * Quick search without full agent conversation
 * @param {Object} params - Search parameters
 * @returns {Promise<Object>} Search results
 */
export async function quickSearch({ query, category, maxPrice }) {
  const { searchProducts } = await import("../tools/buyerTools.js");
  
  try {
    const result = await searchProducts.invoke({
      query,
      category,
      maxPrice,
      limit: 10,
    });
    return JSON.parse(result);
  } catch (error) {
    console.error("Error in quick search:", error);
    throw error;
  }
}

/**
 * Quick price check without full agent
 * @param {number} productId - Product ID to check
 * @returns {Promise<Object>} Price fairness analysis
 */
export async function quickPriceCheck(productId) {
  const { checkPriceFairness } = await import("../tools/buyerTools.js");
  
  try {
    const result = await checkPriceFairness.invoke({
      productId,
    });
    return JSON.parse(result);
  } catch (error) {
    console.error("Error in quick price check:", error);
    throw error;
  }
}

export default {
  processBuyerMessage,
  quickSearch,
  quickPriceCheck,
};
