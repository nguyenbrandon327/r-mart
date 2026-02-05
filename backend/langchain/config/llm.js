/**
 * LLM Configuration
 * Centralized configuration for LangChain language models
 * Using Google Gemini API
 */

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import dotenv from "dotenv";

dotenv.config();

// Validate Google API key
if (!process.env.GOOGLE_API_KEY) {
  console.warn('⚠️ GOOGLE_API_KEY not set. LangChain features will not work.');
}

/**
 * Create a configured ChatGoogleGenerativeAI instance
 * @param {Object} options - Configuration options
 * @param {string} options.modelName - The model to use (default: gemini-2.5-flash)
 * @param {number} options.temperature - Temperature for responses (default: 0.7)
 * @param {number} options.maxOutputTokens - Max tokens for response (default: 1000)
 * @returns {ChatGoogleGenerativeAI} Configured Gemini instance
 */
export function createLLM(options = {}) {
  const {
    modelName = "gemini-2.5-flash",
    temperature = 0.7,
    maxOutputTokens = 1000,
  } = options;

  return new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
    model: modelName,
    temperature,
    maxOutputTokens,
  });
}

// Pre-configured LLM instances for different use cases

// Router uses low temperature for consistent routing decisions
export const routerLLM = createLLM({ 
  temperature: 0, 
  modelName: "gemini-2.5-flash" 
});

// Agent LLM uses moderate temperature for helpful, varied responses
export const agentLLM = createLLM({ 
  temperature: 0.7, 
  modelName: "gemini-2.5-flash" 
});

// For any embedding-related LLM tasks
export const embeddingLLM = createLLM({ 
  temperature: 0, 
  modelName: "gemini-2.5-flash" 
});

export default {
  createLLM,
  routerLLM,
  agentLLM,
  embeddingLLM,
};
