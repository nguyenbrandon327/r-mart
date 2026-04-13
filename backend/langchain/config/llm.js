/**
 * LLM Configuration
 * Centralized configuration for LangChain language models
 * Using OpenAI API
 */

import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️ OPENAI_API_KEY not set. LangChain features will not work.');
}

/**
 * Create a configured ChatOpenAI instance
 * @param {Object} options - Configuration options
 * @param {string} options.modelName - The model to use (default: gpt-4o-mini)
 * @param {number} options.temperature - Temperature for responses (default: 0.7)
 * @param {number} options.maxTokens - Max tokens for response (default: 1000)
 * @returns {ChatOpenAI} Configured OpenAI instance
 */
export function createLLM(options = {}) {
  const {
    modelName = "gpt-4o-mini",
    temperature = 0.7,
    maxTokens = 1000,
  } = options;

  return new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    model: modelName,
    temperature,
    maxTokens,
    maxRetries: 0,
  });
}

// Router uses low temperature for consistent routing decisions
export const routerLLM = createLLM({
  temperature: 0,
  modelName: "gpt-4o-mini",
});

// Agent LLM uses moderate temperature for helpful, varied responses
export const agentLLM = createLLM({
  temperature: 0.7,
  modelName: "gpt-4o-mini",
});

// For any embedding-related LLM tasks
export const embeddingLLM = createLLM({
  temperature: 0,
  modelName: "gpt-4o-mini",
});

export default {
  createLLM,
  routerLLM,
  agentLLM,
  embeddingLLM,
};
