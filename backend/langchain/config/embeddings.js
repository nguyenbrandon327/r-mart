/**
 * Embeddings Configuration
 * OpenAI text-embedding-3-small with native dimension reduction to 768.
 * Image embeddings via Vertex AI multimodalembedding@001.
 */

import { OpenAIEmbeddings } from "@langchain/openai";
import { GoogleAuth } from "google-auth-library";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const EMBEDDING_DIMENSIONS = 768;

const embedder = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  model: "text-embedding-3-small",
  dimensions: EMBEDDING_DIMENSIONS,
});

export const imageEmbeddingsConfig = {
  provider: "vertex-ai",
  modelName: "multimodalembedding@001",
  dimensions: 1408,
  enabled: !!(process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.GCP_PROJECT_ID && process.env.GCP_REGION),
};

let _authClient = null;

async function getAuthClient() {
  if (!_authClient) {
    const auth = new GoogleAuth({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    _authClient = await auth.getClient();
  }
  return _authClient;
}

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

/**
 * Generate an image embedding via Vertex AI multimodalembedding@001.
 * @param {Object} opts
 * @param {Buffer} [opts.imageBuffer] - Raw image bytes (preferred)
 * @param {string} [opts.imageBase64] - Base64-encoded image string
 * @param {string} [opts.imageUrl] - HTTP(S) URL; will be fetched and converted to base64
 * @returns {Promise<number[]>} 1408-dimensional embedding vector
 */
export async function generateImageEmbedding({ imageBuffer, imageBase64, imageUrl } = {}) {
  if (!imageEmbeddingsConfig.enabled) {
    throw new Error(
      "Image embeddings not configured. Set GOOGLE_APPLICATION_CREDENTIALS, GCP_PROJECT_ID, and GCP_REGION."
    );
  }

  let base64Data;

  if (imageBuffer) {
    base64Data = imageBuffer.toString("base64");
  } else if (imageBase64) {
    base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  } else if (imageUrl) {
    const resp = await axios.get(imageUrl, { responseType: "arraybuffer" });
    base64Data = Buffer.from(resp.data).toString("base64");
  } else {
    throw new Error("Provide imageBuffer, imageBase64, or imageUrl");
  }

  const project = process.env.GCP_PROJECT_ID;
  const region = process.env.GCP_REGION;
  const endpoint = `https://${region}-aiplatform.googleapis.com/v1/projects/${project}/locations/${region}/publishers/google/models/multimodalembedding@001:predict`;

  const client = await getAuthClient();
  const { token } = await client.getAccessToken();

  const { data } = await axios.post(
    endpoint,
    { instances: [{ image: { bytesBase64Encoded: base64Data } }] },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const embedding = data?.predictions?.[0]?.imageEmbedding;
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error("Unexpected Vertex AI response: no imageEmbedding returned");
  }

  return embedding;
}

export default {
  EMBEDDING_DIMENSIONS,
  buildProductEmbeddingText,
  embedQuery,
  embedDocument,
  embedDocuments,
  imageEmbeddingsConfig,
  generateImageEmbedding,
};
