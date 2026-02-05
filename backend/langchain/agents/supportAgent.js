/**
 * Support & Security Agent
 * Handles help requests, policy questions, and security concerns
 * 
 * Uses a simple tool-calling approach compatible with Google Gemini
 */

import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { agentLLM } from "../config/llm.js";
import { SUPPORT_SYSTEM_PROMPT, SUPPORT_HUMAN_PROMPT } from "../prompts/supportPrompt.js";
import { supportTools } from "../tools/supportTools.js";
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";

/**
 * Create the support agent prompt
 */
const supportPrompt = ChatPromptTemplate.fromMessages([
  ["system", SUPPORT_SYSTEM_PROMPT],
  new MessagesPlaceholder("chat_history"),
  ["human", SUPPORT_HUMAN_PROMPT],
]);

// Create LLM with tools bound
const supportLLMWithTools = agentLLM.bindTools(supportTools);

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
  const tool = supportTools.find(t => t.name === toolName);
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
 * Process a message with the support agent
 * @param {Object} params - Parameters
 * @param {string} params.input - User's message
 * @param {Array} params.chatHistory - Previous chat messages
 * @param {Object} params.userContext - User context (username, etc.)
 * @returns {Promise<Object>} Agent response
 */
export async function processSupportMessage({ input, chatHistory = [], userContext = {} }) {
  try {
    const intermediateSteps = [];
    
    // Pre-search for relevant policy context
    let policyContext = "No specific policy context.";
    
    // Check if the message might be policy-related
    const policyKeywords = ["policy", "terms", "privacy", "data", "account", "delete", "rules"];
    const isPolicyRelated = policyKeywords.some((kw) => input.toLowerCase().includes(kw));
    
    if (isPolicyRelated) {
      const { searchPolicies } = await import("../tools/supportTools.js");
      try {
        const policyResult = await searchPolicies.invoke({ query: input });
        const parsed = JSON.parse(policyResult);
        if (parsed.found && parsed.topResults?.length > 0) {
          policyContext = parsed.topResults
            .map((r) => `[${r.policyTitle} - ${r.sectionTitle}]: ${r.content}`)
            .join("\n\n");
        }
      } catch (e) {
        console.error("Error pre-fetching policy context:", e);
      }
    }

    // Format the prompt
    const formattedPrompt = await supportPrompt.formatMessages({
      input,
      chat_history: formatChatHistory(chatHistory),
      chatHistory: formatChatHistoryString(chatHistory),
      policyContext,
    });

    // Initial LLM call
    let response = await supportLLMWithTools.invoke(formattedPrompt);
    
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
      
      response = await supportLLMWithTools.invoke(messagesWithTools);
    }

    return {
      success: true,
      output: response.content,
      intermediateSteps,
    };
  } catch (error) {
    console.error("Error in support agent:", error);
    return {
      success: false,
      error: error.message,
      output: "I apologize, but I encountered an error. For urgent help, please contact support directly through the platform.",
    };
  }
}

/**
 * Quick scam analysis without full agent
 * @param {string} text - Text to analyze
 * @param {string} context - Context (listing, message, etc.)
 * @returns {Promise<Object>} Scam analysis
 */
export async function quickScamCheck(text, context = "general") {
  const { analyzeForScam } = await import("../tools/supportTools.js");
  
  try {
    const result = await analyzeForScam.invoke({
      text,
      context,
    });
    return JSON.parse(result);
  } catch (error) {
    console.error("Error in quick scam check:", error);
    throw error;
  }
}

/**
 * Get help for a specific topic without full agent
 * @param {string} topic - Help topic
 * @returns {Promise<Object>} Help information
 */
export async function quickHelp(topic) {
  const { getPlatformHelp } = await import("../tools/supportTools.js");
  
  try {
    const result = await getPlatformHelp.invoke({ topic });
    return JSON.parse(result);
  } catch (error) {
    console.error("Error in quick help:", error);
    throw error;
  }
}

export default {
  processSupportMessage,
  quickScamCheck,
  quickHelp,
};
