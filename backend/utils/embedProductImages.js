/**
 * Backfill script: generate Vertex AI image embeddings for existing products
 * and store them in the image_embeddings table (pgvector).
 *
 * Usage:  node utils/embedProductImages.js [--limit N] [--offset N] [--product-id N]
 *
 * Requires env vars: GOOGLE_APPLICATION_CREDENTIALS, GCP_PROJECT_ID, GCP_REGION,
 *                    PGHOST, PGDATABASE, PGUSER, PGPASSWORD
 */

import dotenv from "dotenv";
dotenv.config();

import { sql } from "../config/db.js";
import { generateImageEmbedding, imageEmbeddingsConfig } from "../langchain/config/embeddings.js";

const args = process.argv.slice(2);
function getArg(name, fallback) {
  const idx = args.indexOf(name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}

const LIMIT = parseInt(getArg("--limit", "100"), 10);
const OFFSET = parseInt(getArg("--offset", "0"), 10);
const PRODUCT_ID = getArg("--product-id", null);

async function main() {
  if (!imageEmbeddingsConfig.enabled) {
    console.error("Image embeddings are not configured. Check GOOGLE_APPLICATION_CREDENTIALS, GCP_PROJECT_ID, GCP_REGION.");
    process.exit(1);
  }

  console.log(`Fetching products (limit=${LIMIT}, offset=${OFFSET})…`);

  let products;
  if (PRODUCT_ID) {
    products = await sql`
      SELECT id, name, images FROM products WHERE id = ${parseInt(PRODUCT_ID, 10)}
    `;
  } else {
    products = await sql`
      SELECT id, name, images FROM products
      WHERE images IS NOT NULL AND array_length(images, 1) > 0
      ORDER BY id
      LIMIT ${LIMIT} OFFSET ${OFFSET}
    `;
  }

  console.log(`Found ${products.length} product(s) with images.`);

  let embedded = 0;
  let skipped = 0;
  let failed = 0;

  for (const product of products) {
    const images = product.images || [];
    for (const imageUrl of images) {
      const existing = await sql`
        SELECT id FROM image_embeddings WHERE product_id = ${product.id} AND image_url = ${imageUrl}
      `;
      if (existing.length > 0) {
        skipped++;
        continue;
      }

      try {
        console.log(`  Embedding product ${product.id} "${product.name}" — ${imageUrl.substring(0, 60)}…`);
        const embedding = await generateImageEmbedding({ imageUrl });
        const vecStr = `[${embedding.join(",")}]`;
        await sql`
          INSERT INTO image_embeddings (product_id, image_url, embedding)
          VALUES (${product.id}, ${imageUrl}, ${vecStr}::vector)
        `;
        embedded++;
      } catch (err) {
        console.error(`  FAILED product ${product.id} image ${imageUrl}: ${err.message}`);
        failed++;
      }
    }
  }

  console.log(`\nDone. Embedded: ${embedded}, Skipped (already exists): ${skipped}, Failed: ${failed}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
