/**
 * Backfill pgvector embeddings for existing products.
 *
 * Usage:  node utils/backfillEmbeddings.js
 *
 * Processes products in batches to respect Google API rate limits.
 * Safe to re-run — only targets rows where embedding IS NULL.
 */

import { sql } from "../config/db.js";
import {
  buildProductEmbeddingText,
  embedDocument,
} from "../langchain/config/embeddings.js";

const FORCE = process.argv.includes("--force");
const BATCH_SIZE = 20;
const DELAY_MS = 1500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function backfill() {
  if (FORCE) {
    console.log("--force flag detected. Clearing all existing embeddings…");
    await sql`UPDATE products SET embedding = NULL`;
  }

  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM products WHERE embedding IS NULL
  `;

  if (count === 0) {
    console.log("All products already have embeddings. Nothing to do.");
    console.log("Tip: use --force to re-embed all products (e.g. after switching embedding models).");
    process.exit(0);
  }

  console.log(`Found ${count} products to embed. Starting backfill…\n`);

  let processed = 0;
  let failed = 0;

  while (true) {
    const batch = await sql`
      SELECT id, name, price, category, description
      FROM products
      WHERE embedding IS NULL
      ORDER BY id
      LIMIT ${BATCH_SIZE}
    `;

    if (batch.length === 0) break;

    for (const product of batch) {
      try {
        const text = buildProductEmbeddingText(product);
        const vector = await embedDocument(text);
        const pgVector = `[${vector.join(",")}]`;
        await sql`UPDATE products SET embedding = ${pgVector}::vector WHERE id = ${product.id}`;
        processed++;
        process.stdout.write(`\r  Embedded ${processed}/${count} (${failed} failed)`);
      } catch (err) {
        failed++;
        console.error(`\n  Failed product ${product.id}: ${err.message}`);
      }
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n\nDone! Embedded ${processed} products. ${failed} failures.`);
  process.exit(0);
}

backfill().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
