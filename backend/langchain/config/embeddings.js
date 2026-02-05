/**
 * Embeddings Configuration
 * Configuration for text and image embeddings
 * Using Google Generative AI Embeddings
 * 
 * Future: Will integrate with pgvector for semantic search
 * Future: Will integrate with Vertex AI for image embeddings
 */

import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

/**
 * Create Google Generative AI text embeddings instance
 * Used for semantic search on listings, policies, and chat history
 * 
 * Model: text-embedding-004 (Google's latest embedding model)
 * Dimensions: 768 (default)
 */
export const textEmbeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "text-embedding-004",
  taskType: TaskType.RETRIEVAL_DOCUMENT,
});

/**
 * Placeholder for image embeddings configuration
 * Will be implemented with Vertex AI Multimodal Embeddings
 */
export const imageEmbeddingsConfig = {
  provider: "vertex-ai", // or "google-cloud-vision"
  modelName: "multimodalembedding@001",
  dimensions: 1408, // Vertex AI multimodal embedding dimension
  // Note: Requires Google Cloud credentials to be configured
  enabled: false, // Enable when Google Cloud is configured
};

/**
 * Generate text embedding for a given text
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} Embedding vector
 */
export async function generateTextEmbedding(text) {
  try {
    const embedding = await textEmbeddings.embedQuery(text);
    return embedding;
  } catch (error) {
    console.error("Error generating text embedding:", error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts (batch)
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<number[][]>} Array of embedding vectors
 */
export async function generateTextEmbeddings(texts) {
  try {
    const embeddings = await textEmbeddings.embedDocuments(texts);
    return embeddings;
  } catch (error) {
    console.error("Error generating text embeddings:", error);
    throw error;
  }
}

/**
 * Placeholder for image embedding generation
 * Will be implemented with Vertex AI
 * @param {string} imageUrl - URL of the image to embed
 * @returns {Promise<number[]>} Image embedding vector
 */
export async function generateImageEmbedding(imageUrl) {
  // TODO: Implement with Vertex AI Multimodal Embeddings
  // This will be enabled once Google Cloud is configured
  throw new Error("Image embeddings not yet implemented. Requires Vertex AI configuration.");
}

export default {
  textEmbeddings,
  imageEmbeddingsConfig,
  generateTextEmbedding,
  generateTextEmbeddings,
  generateImageEmbedding,
};
