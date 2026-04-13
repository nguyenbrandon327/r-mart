/**
 * LangChain Module Index
 * Main entry point for all LangChain functionality
 * 
 * Architecture Overview:
 * =====================
 * 
 * 1. Router Agent (routerAgent.js)
 *    - Analyzes user intent
 *    - Routes to appropriate specialized agent
 *    - Uses quick routing for obvious cases, LLM for ambiguous ones
 * 
 * 2. Seller Copilot (sellerAgent.js)
 *    - Helps users create listings
 *    - Estimates prices based on market data
 *    - Generates descriptions
 *    Tools: searchSimilarListings, generateDescription, estimatePrice
 * 
 * 3. Buyer Assistant (buyerAgent.js)
 *    - Searches for products
 *    - Compares listings
 *    - Provides recommendations
 *    Tools: searchProducts, compareListings, checkPriceFairness, getRecommendations
 * 
 * 4. Support/Security Agent (supportAgent.js)
 *    - Answers policy questions (RAG over Terms/Privacy)
 *    - Detects potential scams
 *    - Provides platform help
 *    Tools: searchPolicies, analyzeForScam, getPlatformHelp
 * 
 * Future Extensions:
 * - pgvector integration for semantic search
 * - Vertex AI for image embeddings
 * - Streaming responses
 * - Multi-turn conversation memory with database persistence
 */

// Configuration
export * from './config/index.js';

// Prompts
export * from './prompts/index.js';

// Tools
export * from './tools/index.js';

// Agents
export * from './agents/index.js';

// Services
export * from './services/index.js';

// Version info
export const LANGCHAIN_MODULE_VERSION = "1.0.0";

