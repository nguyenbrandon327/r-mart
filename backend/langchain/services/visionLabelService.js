/**
 * Vision Label Service
 *
 * Uses the Cloud Vision API (images:annotate LABEL_DETECTION) to extract labels
 * and confidence scores from an uploaded image.
 *
 * We intentionally implement this via REST + google-auth-library (already in the
 * project) to avoid adding new runtime dependencies.
 */

import { GoogleAuth } from "google-auth-library";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const visionLabelsConfig = {
  enabled:
    (process.env.VISION_LABELS_ENABLED ?? "true") !== "false" &&
    !!(process.env.VISION_APPLICATION_CREDENTIALS && process.env.VISION_PROJECT_ID),
  maxResults: Number.parseInt(process.env.VISION_LABELS_MAX_RESULTS || "8", 10),
};

let _authClient = null;

async function getAuthClient() {
  if (!_authClient) {
    const auth = new GoogleAuth({
      keyFilename: process.env.VISION_APPLICATION_CREDENTIALS,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    _authClient = await auth.getClient();
  }
  return _authClient;
}

/**
 * Detect labels for an image.
 * @param {Object} opts
 * @param {Buffer} opts.imageBuffer
 * @param {number} [opts.maxResults]
 * @returns {Promise<Array<{description: string, score: number, topicality: number}>>}
 */
export async function detectImageLabels({ imageBuffer, maxResults } = {}) {
  if (!visionLabelsConfig.enabled) {
    throw new Error(
      "Vision labels not configured. Set GOOGLE_APPLICATION_CREDENTIALS and GCP_PROJECT_ID (and ensure VISION_LABELS_ENABLED is not false)."
    );
  }
  if (!imageBuffer || !(imageBuffer instanceof Buffer)) {
    throw new Error("detectImageLabels requires imageBuffer (Buffer)");
  }

  const max = Number.isFinite(maxResults) ? maxResults : visionLabelsConfig.maxResults;
  const base64 = imageBuffer.toString("base64");

  const client = await getAuthClient();
  const { token } = await client.getAccessToken();


  console.log("token", token);


  // try {
  //   const { data } = await axios.post(
  //     "https://vision.googleapis.com/v1/images:annotate",
  //     { 
  //       requests: [
  //         {
  //           image: { content: base64 },
  //           features: [{ type: "LABEL_DETECTION", maxResults: max }],
  //         },
  //       ],
  //     },
  //     {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         "Content-Type": "application/json",
  //         "x-goog-user-project": process.env.VISION_PROJECT_ID,
  //       },
  //       timeout: Number.parseInt(process.env.VISION_HTTP_TIMEOUT_MS || "8000", 10),
  //     }
  //   );
  // } catch (vision_error) {
  //   console.error("Vision API detailed error:", vision_error.response?.data || vision_error.message);
  //   throw vision_error;
  // }



  const { data } = await axios.post(
    "https://vision.googleapis.com/v1/images:annotate",
    {
      requests: [
        {
          image: { content: base64 },
          features: [{ type: "LABEL_DETECTION", maxResults: max },
            {type: "LOGO_DETECTION", maxResults: max},
          ],
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "x-goog-user-project": process.env.VISION_PROJECT_ID,
      },
      timeout: Number.parseInt(process.env.VISION_HTTP_TIMEOUT_MS || "8000", 10),
    }
  );

  const resp = data?.responses?.[0];
  if (resp?.error?.message) {
    throw new Error(`Vision API error: ${resp.error.message}`);
  }

  // const labels = (resp?.labelAnnotations || []).map((a) => ({
  //   description: a.description,
  //   score: typeof a.score === "number" ? a.score : 0,
  //   topicality: typeof a.topicality === "number" ? a.topicality : 0,
  // }));


  const labelItems = resp?.labelAnnotations || [];
  const logoItems = resp?.logoAnnotations || [];
  const labels = [
    ...labelItems.map(a => ({
      description: a.description,
      score: typeof a.score === "number" ? a.score : 0,
      topicality: typeof a.topicality === "number" ? a.topicality : 0,
    })),
    ...logoItems.map(a => ({
      description: a.description,
      score: typeof a.score === "number" ? a.score : 0,
      topicality: typeof a.topicality === "number" ? a.topicality : 0,
    })),
  ];

  // The API typically returns already sorted, but keep it deterministic.
  labels.sort((a, b) => b.score - a.score);
  return labels;
}

export default {
  visionLabelsConfig,
  detectImageLabels,
};

