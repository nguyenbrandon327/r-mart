/**
 * Embeddings Configuration
 * Text embeddings via Google Generative AI
 * Image embeddings via Vertex AI multimodalembedding@001
 */

import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { GoogleAuth } from "google-auth-library";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const textEmbeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "text-embedding-004",
  taskType: TaskType.RETRIEVAL_DOCUMENT,
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

export async function generateTextEmbedding(text) {
  try {
    const embedding = await textEmbeddings.embedQuery(text);
    return embedding;
  } catch (error) {
    console.error("Error generating text embedding:", error);
    throw error;
  }
}

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
  textEmbeddings,
  imageEmbeddingsConfig,
  generateTextEmbedding,
  generateTextEmbeddings,
  generateImageEmbedding,
};
