/**
 * LLM Configuration
 * Centralized configuration for LangChain language models
 * Using LLMs via LangChain
 */
import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";

dotenv.config();

// Validate OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️ OPENAI_API_KEY not set. LangChain features will not work.");
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
    modelName = "gpt-4o-mini",
    temperature = 0.7,
    maxOutputTokens = 1000,
  } = options;

  return new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: modelName,
    temperature,
    maxTokens: maxOutputTokens,
    // Fail fast on errors (quota, etc.) instead of long retries
    maxRetries: 0,
  });
}

// Pre-configured LLM instances for different use cases

// Router uses low temperature for consistent routing decisions
export const routerLLM = createLLM({ 
  temperature: 0, 
  modelName: "gpt-4o-mini" 
});

// Agent LLM uses moderate temperature for helpful, varied responses
export const agentLLM = createLLM({ 
  temperature: 0.7, 
  modelName: "gpt-4o-mini" 
});

// For any embedding-related LLM tasks
export const embeddingLLM = createLLM({ 
  temperature: 0, 
  modelName: "gpt-4o-mini" 
});

export default {
  createLLM,
  routerLLM,
  agentLLM,
  embeddingLLM,
};
