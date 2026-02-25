/**
 * Embeddings Configuration
 * OpenAI text-embedding-3-small with native dimension reduction to 768.
 * Uses the same 768-dim pgvector column for semantic search.
 */

import { OpenAIEmbeddings } from "@langchain/openai";
import dotenv from "dotenv";

dotenv.config();

export const EMBEDDING_DIMENSIONS = 768;

const embedder = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  model: "text-embedding-3-small",
  dimensions: EMBEDDING_DIMENSIONS,
});

/**
 * Build a single string that captures everything meaningful about a product
 * so the embedding covers name, category, price range, and description.
 */
export function buildProductEmbeddingText(product) {
  const parts = [
    product.name,
    product.category,
    product.description,
    product.price != null ? `$${product.price}` : null,
  ].filter(Boolean);
  return parts.join(" | ");
}

/**
 * Generate an embedding for a search query.
 * @param {string} text
 * @returns {Promise<number[]>} 768-dimensional vector
 */
export async function embedQuery(text) {
  return embedder.embedQuery(text);
}

/**
 * Generate an embedding for a document (product listing).
 * @param {string} text
 * @returns {Promise<number[]>} 768-dimensional vector
 */
export async function embedDocument(text) {
  return embedder.embedQuery(text);
}

/**
 * Batch-embed multiple document texts.
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
export async function embedDocuments(texts) {
  return embedder.embedDocuments(texts);
}

export default {
  EMBEDDING_DIMENSIONS,
  buildProductEmbeddingText,
  embedQuery,
  embedDocument,
  embedDocuments,
};
