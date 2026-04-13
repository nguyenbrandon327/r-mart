/**
 * Buyer Assistant Tools
 * Tools for searching products, comparing listings, and helping buyers.
 * Uses pgvector semantic search with ILIKE keyword fallback.
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { sql } from "../../config/db.js";
import { embedQuery, generateImageEmbedding, imageEmbeddingsConfig } from "../config/embeddings.js";

const VALID_CATEGORIES = [
  "clothes", "tech", "textbooks", "furniture", "kitchen",
  "food", "vehicles", "housing", "rides", "renting",
  "merch", "tickets", "other", "in-searching-for",
];

/**
 * Semantic + keyword hybrid search for products.
 *
 * Strategy:
 *  1. Embed the query and run a cosine-similarity search against products that
 *     have an embedding (pgvector).
 *  2. Fall back to ILIKE keyword search for products that haven't been embedded
 *     yet (or if embedding generation fails).
 *  3. Merge, deduplicate, and return the combined results.
 */
export const searchProducts = tool(
  async ({ query, category, minPrice, maxPrice, sortBy = "relevance", limit = 10, page = 1 }) => {
    try {
      const offset = (page - 1) * limit;
      const results = [];

      // --- 1. Semantic (vector) search ---
      try {
        const queryVector = await embedQuery(query);
        const pgVector = `[${queryVector.join(",")}]`;

        const vectorResults = await sql`
          SELECT
            p.id, p.name, p.price, p.category, p.description, p.images,
            p.created_at, p.slug,
            u.name  AS seller_name,
            u.username AS seller_username,
            1 - (p.embedding <=> ${pgVector}::vector) AS similarity
          FROM products p
          JOIN users u ON p.user_id = u.id
          WHERE p.is_sold = false
            AND p.embedding IS NOT NULL
            ${category ? sql`AND p.category = ${category}` : sql``}
            ${minPrice != null ? sql`AND p.price >= ${minPrice}` : sql``}
            ${maxPrice != null ? sql`AND p.price <= ${maxPrice}` : sql``}
          ORDER BY p.embedding <=> ${pgVector}::vector
          LIMIT ${limit} OFFSET ${offset}
        `;

        for (const r of vectorResults) {
          if (parseFloat(r.similarity) > 0.3) {
            results.push({ ...r, _source: "semantic" });
          }
        }
      } catch (vecErr) {
        console.error("Vector search failed, falling back to keyword:", vecErr.message);
      }

      // --- 2. Keyword (ILIKE) fallback for unembedded rows or if vector search returned few results ---
      if (results.length < limit) {
        const existingIds = results.map(r => r.id);
        const keywordLimit = limit - results.length;

        const keywordResults = await sql`
          SELECT
            p.id, p.name, p.price, p.category, p.description, p.images,
            p.created_at, p.slug,
            u.name  AS seller_name,
            u.username AS seller_username
          FROM products p
          JOIN users u ON p.user_id = u.id
          WHERE p.is_sold = false
            AND (p.name ILIKE ${'%' + query + '%'} OR p.description ILIKE ${'%' + query + '%'})
            ${existingIds.length > 0 ? sql`AND p.id != ALL(${existingIds})` : sql``}
            ${category ? sql`AND p.category = ${category}` : sql``}
            ${minPrice != null ? sql`AND p.price >= ${minPrice}` : sql``}
            ${maxPrice != null ? sql`AND p.price <= ${maxPrice}` : sql``}
          ORDER BY p.created_at DESC
          LIMIT ${keywordLimit} OFFSET ${results.length === 0 ? offset : 0}
        `;

        for (const r of keywordResults) {
          results.push({ ...r, _source: "keyword" });
        }
      }

      // --- 3. Sort combined results ---
      switch (sortBy) {
        case "price_low":
          results.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
          break;
        case "price_high":
          results.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
          break;
        case "newest":
          results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          break;
        // "relevance" keeps semantic results first, then keyword results
      }

      if (results.length === 0) {
        return JSON.stringify({
          found: false,
          message: "No products found matching your criteria.",
          suggestions: [
            "Try broader search terms",
            "Remove some filters",
            "Check for spelling",
            "Try different categories"
          ]
        });
      }

      const formatted = results.map(item => ({
        id: item.id,
        name: item.name,
        price: parseFloat(item.price),
        category: item.category,
        slug: item.slug,
        description: item.description?.substring(0, 150) + (item.description?.length > 150 ? "..." : ""),
        image: item.images?.[0] || null,
        seller: item.seller_name,
        sellerUsername: item.seller_username,
      }));

      const prices = results.map(r => parseFloat(r.price));

      return JSON.stringify({
        found: true,
        count: formatted.length,
        page,
        priceRange: {
          min: Math.min(...prices),
          max: Math.max(...prices),
          average: +(prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2),
        },
        products: formatted,
      });
    } catch (error) {
      console.error("Error searching products:", error);
      return JSON.stringify({ error: "Failed to search products", details: error.message });
    }
  },
  {
    name: "searchProducts",
    description:
      "Search for products in the marketplace using semantic (meaning-based) search. " +
      "Understands synonyms and intent — e.g. 'couch' finds 'sofa', 'apartment' finds 'housing'. " +
      "Supports filters for category, price range, sorting, and pagination.",
    schema: z.object({
      query: z.string().describe("Natural language search query describing what the user is looking for"),
      category: z.enum(VALID_CATEGORIES).optional().describe("Filter by category slug"),
      minPrice: z.number().optional().describe("Minimum price filter"),
      maxPrice: z.number().optional().describe("Maximum price filter"),
      sortBy: z.enum(["relevance", "price_low", "price_high", "newest"]).optional()
        .describe("Sort order (default: relevance)"),
      limit: z.number().min(1).max(25).optional().describe("Results per page (default 10, max 25)"),
      page: z.number().min(1).optional().describe("Page number for pagination (default 1)"),
    }),
  }
);

/**
 * Browse all listings in a category without requiring a keyword.
 */
export const browseByCategory = tool(
  async ({ category, minPrice, maxPrice, sortBy = "newest", limit = 10, page = 1 }) => {
    try {
      const offset = (page - 1) * limit;

      let orderClause;
      switch (sortBy) {
        case "price_low":
          orderClause = sql`ORDER BY p.price ASC`;
          break;
        case "price_high":
          orderClause = sql`ORDER BY p.price DESC`;
          break;
        case "newest":
        default:
          orderClause = sql`ORDER BY p.created_at DESC`;
          break;
      }

      const results = await sql`
        SELECT
          p.id, p.name, p.price, p.category, p.description, p.images,
          p.created_at, p.slug,
          u.name AS seller_name,
          u.username AS seller_username
        FROM products p
        JOIN users u ON p.user_id = u.id
        WHERE p.is_sold = false
          AND p.category = ${category}
          ${minPrice != null ? sql`AND p.price >= ${minPrice}` : sql``}
          ${maxPrice != null ? sql`AND p.price <= ${maxPrice}` : sql``}
        ${orderClause}
        LIMIT ${limit} OFFSET ${offset}
      `;

      const [{ total }] = await sql`
        SELECT COUNT(*)::int AS total
        FROM products
        WHERE is_sold = false
          AND category = ${category}
          ${minPrice != null ? sql`AND price >= ${minPrice}` : sql``}
          ${maxPrice != null ? sql`AND price <= ${maxPrice}` : sql``}
      `;

      if (results.length === 0) {
        return JSON.stringify({
          found: false,
          category,
          message: `No available listings found in the "${category}" category.`,
        });
      }

      const formatted = results.map(item => ({
        id: item.id,
        name: item.name,
        price: parseFloat(item.price),
        category: item.category,
        slug: item.slug,
        description: item.description?.substring(0, 150) + (item.description?.length > 150 ? "..." : ""),
        image: item.images?.[0] || null,
        seller: item.seller_name,
        sellerUsername: item.seller_username,
      }));

      const prices = results.map(r => parseFloat(r.price));

      return JSON.stringify({
        found: true,
        count: formatted.length,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        priceRange: {
          min: Math.min(...prices),
          max: Math.max(...prices),
          average: +(prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2),
        },
        products: formatted,
      });
    } catch (error) {
      console.error("Error browsing category:", error);
      return JSON.stringify({ error: "Failed to browse category", details: error.message });
    }
  },
  {
    name: "browseByCategory",
    description:
      "Browse all available listings in a specific category without needing a keyword. " +
      "Use this when users say things like 'show me all housing', 'list tickets', 'what furniture is available'. " +
      "Supports price filters, sorting, and pagination.",
    schema: z.object({
      category: z.enum(VALID_CATEGORIES).describe("Category to browse"),
      minPrice: z.number().optional().describe("Minimum price filter"),
      maxPrice: z.number().optional().describe("Maximum price filter"),
      sortBy: z.enum(["newest", "price_low", "price_high"]).optional()
        .describe("Sort order (default: newest)"),
      limit: z.number().min(1).max(25).optional().describe("Results per page (default 10, max 25)"),
      page: z.number().min(1).optional().describe("Page number for pagination (default 1)"),
    }),
  }
);

/**
 * Compare multiple listings side by side
 */
export const compareListings = tool(
  async ({ productIds }) => {
    try {
      if (productIds.length < 2) {
        return JSON.stringify({ error: "Need at least 2 products to compare" });
      }
      if (productIds.length > 5) {
        return JSON.stringify({ error: "Can compare maximum 5 products at once" });
      }

      const results = await sql`
        SELECT
          p.id, p.name, p.price, p.category, p.description,
          p.images, p.created_at, p.slug,
          u.name AS seller_name,
          u.username AS seller_username
        FROM products p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ANY(${productIds})
          AND p.is_sold = false
      `;

      if (results.length === 0) {
        return JSON.stringify({ error: "No products found with the given IDs" });
      }

      const comparison = results.map(item => ({
        id: item.id,
        name: item.name,
        price: parseFloat(item.price),
        category: item.category,
        slug: item.slug,
        description: item.description,
        hasImages: item.images && item.images.length > 0,
        imageCount: item.images?.length || 0,
        seller: item.seller_name,
        sellerUsername: item.seller_username,
        daysListed: Math.floor((Date.now() - new Date(item.created_at)) / (1000 * 60 * 60 * 24)),
      }));

      const sortedByPrice = [...comparison].sort((a, b) => a.price - b.price);
      const sortedByDescription = [...comparison].sort(
        (a, b) => (b.description?.length || 0) - (a.description?.length || 0)
      );

      return JSON.stringify({
        products: comparison,
        analysis: {
          bestValue: {
            id: sortedByPrice[0].id,
            name: sortedByPrice[0].name,
            price: sortedByPrice[0].price,
            reason: "Lowest price",
          },
          mostDetailed: {
            id: sortedByDescription[0].id,
            name: sortedByDescription[0].name,
            reason: "Most detailed description",
          },
          priceRange: {
            lowest: sortedByPrice[0].price,
            highest: sortedByPrice.at(-1).price,
            difference: sortedByPrice.at(-1).price - sortedByPrice[0].price,
          },
        },
        tips: [
          "Consider asking sellers about the item's history",
          "Check if any include accessories or extras",
          "Factor in meetup convenience",
        ],
      });
    } catch (error) {
      console.error("Error comparing listings:", error);
      return JSON.stringify({ error: "Failed to compare listings", details: error.message });
    }
  },
  {
    name: "compareListings",
    description: "Compare multiple product listings side by side to help make a decision",
    schema: z.object({
      productIds: z.array(z.number()).describe("Array of product IDs to compare (2-5 products)"),
    }),
  }
);

/**
 * Check if a price is fair based on similar listings in the marketplace
 */
export const checkPriceFairness = tool(
  async ({ productId, productName, price, category }) => {
    try {
      let targetProduct = null;
      if (productId) {
        const [product] = await sql`
          SELECT name, price, category, description
          FROM products WHERE id = ${productId}
        `;
        if (product) {
          targetProduct = product;
          productName = product.name;
          price = parseFloat(product.price);
          category = product.category;
        }
      }

      if (!productName || !category) {
        return JSON.stringify({
          analyzed: false,
          message: "Need either a productId or both productName and category to analyze price.",
        });
      }

      // Use semantic search to find truly similar products
      let similarProducts = [];
      try {
        const queryVector = await embedQuery(`${productName} ${category}`);
        const pgVector = `[${queryVector.join(",")}]`;

        similarProducts = await sql`
          SELECT price, name,
            1 - (embedding <=> ${pgVector}::vector) AS similarity
          FROM products
          WHERE is_sold = false
            AND embedding IS NOT NULL
            ${productId ? sql`AND id != ${productId}` : sql``}
          ORDER BY embedding <=> ${pgVector}::vector
          LIMIT 15
        `;

        // Keep only reasonably similar products
        similarProducts = similarProducts.filter(p => parseFloat(p.similarity) > 0.4);
      } catch {
        // Fallback to keyword match
        similarProducts = await sql`
          SELECT price, name
          FROM products
          WHERE is_sold = false
            AND category = ${category}
            AND name ILIKE ${'%' + productName.split(' ')[0] + '%'}
            ${productId ? sql`AND id != ${productId}` : sql``}
          LIMIT 15
        `;
      }

      if (similarProducts.length < 3) {
        return JSON.stringify({
          analyzed: false,
          message: "Not enough similar listings to determine fair price",
          suggestion: "This might be a unique item - research online for comparable prices",
        });
      }

      const prices = similarProducts.map(p => parseFloat(p.price));
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const sortedPrices = [...prices].sort((a, b) => a - b);
      const percentile = (sortedPrices.filter(p => p <= price).length / sortedPrices.length) * 100;

      let verdict;
      if (price < avgPrice * 0.7) {
        verdict = "Below Market - Great Deal!";
      } else if (price < avgPrice * 0.9) {
        verdict = "Below Average - Good Value";
      } else if (price <= avgPrice * 1.1) {
        verdict = "Fair Price - Market Rate";
      } else if (price <= avgPrice * 1.3) {
        verdict = "Above Average - Consider Negotiating";
      } else {
        verdict = "Above Market - Try to Negotiate Down";
      }

      return JSON.stringify({
        analyzed: true,
        product: productName,
        askedPrice: price,
        marketData: {
          average: Math.round(avgPrice),
          min: Math.min(...prices),
          max: Math.max(...prices),
          sampleSize: similarProducts.length,
        },
        percentile: Math.round(percentile),
        verdict,
        suggestion:
          price > avgPrice
            ? `Consider offering $${Math.round(avgPrice)} (market average)`
            : "This is a good price - act fast before someone else gets it!",
      });
    } catch (error) {
      console.error("Error checking price:", error);
      return JSON.stringify({ error: "Failed to analyze price", details: error.message });
    }
  },
  {
    name: "checkPriceFairness",
    description: "Check if a listing's price is fair compared to similar products in the marketplace",
    schema: z.object({
      productId: z.number().optional().describe("Product ID to analyze"),
      productName: z.string().optional().describe("Product name (if no ID provided)"),
      price: z.number().optional().describe("Price to check (if no ID provided)"),
      category: z.enum(VALID_CATEGORIES).optional().describe("Product category (if no ID provided)"),
    }),
  }
);

/**
 * Get product recommendations based on category and/or budget
 */
export const getRecommendations = tool(
  async ({ category, budget, sortPreference = "value" }) => {
    try {
      let results;

      if (category && budget) {
        results = await sql`
          SELECT p.id, p.name, p.price, p.category, p.description, p.created_at, p.slug,
                 u.name AS seller_name
          FROM products p
          JOIN users u ON p.user_id = u.id
          WHERE p.is_sold = false
            AND p.category = ${category}
            AND p.price <= ${budget}
          ORDER BY
            CASE WHEN ${sortPreference} = 'price' THEN p.price END ASC,
            CASE WHEN ${sortPreference} = 'newest' THEN p.created_at END DESC,
            p.created_at DESC
          LIMIT 10
        `;
      } else if (category) {
        results = await sql`
          SELECT p.id, p.name, p.price, p.category, p.description, p.created_at, p.slug,
                 u.name AS seller_name
          FROM products p
          JOIN users u ON p.user_id = u.id
          WHERE p.is_sold = false AND p.category = ${category}
          ORDER BY p.created_at DESC
          LIMIT 10
        `;
      } else {
        results = await sql`
          SELECT p.id, p.name, p.price, p.category, p.description, p.created_at, p.slug,
                 u.name AS seller_name
          FROM products p
          JOIN users u ON p.user_id = u.id
          WHERE p.is_sold = false
          ORDER BY p.created_at DESC
          LIMIT 10
        `;
      }

      const recommendations = results.map(item => ({
        id: item.id,
        name: item.name,
        price: parseFloat(item.price),
        category: item.category,
        slug: item.slug,
        preview: item.description?.substring(0, 100) + "...",
        seller: item.seller_name,
        isRecent: (Date.now() - new Date(item.created_at)) < 24 * 60 * 60 * 1000,
      }));

      return JSON.stringify({
        found: recommendations.length > 0,
        count: recommendations.length,
        criteria: { category, budget, sortPreference },
        recommendations,
        tips: budget
          ? [
              `All items are within your $${budget} budget`,
              "Save items you like to compare later",
              "Message sellers to negotiate",
            ]
          : [
              "Set a budget to narrow down options",
              "Browse by category for more focused results",
            ],
      });
    } catch (error) {
      console.error("Error getting recommendations:", error);
      return JSON.stringify({ error: "Failed to get recommendations", details: error.message });
    }
  },
  {
    name: "getRecommendations",
    description: "Get product recommendations based on category and budget preferences",
    schema: z.object({
      category: z.enum(VALID_CATEGORIES).optional().describe("Category to get recommendations for"),
      budget: z.number().optional().describe("Maximum budget"),
      sortPreference: z.enum(["value", "price", "newest"]).optional()
        .describe("How to sort recommendations"),
    }),
  }
);

/**
 * Store an image embedding for a product in pgvector.
 * Called from the chatbot pipeline or the backfill script.
 */
export async function storeImageEmbedding({ productId, imageUrl, embedding }) {
  const vecStr = `[${embedding.join(",")}]`;
  await sql`
    INSERT INTO image_embeddings (product_id, image_url, embedding)
    VALUES (${productId}, ${imageUrl}, ${vecStr}::vector)
    ON CONFLICT DO NOTHING
  `;
}

/**
 * Search image_embeddings by cosine similarity and return matching products.
 * Only returns results above a minimum similarity threshold (default 0.40)
 * and deduplicates by product_id (keeps best-matching image per product).
 */
export async function searchByImageEmbedding(embedding, limit = 10, minSimilarity = 0.40) {
  const vecStr = `[${embedding.join(",")}]`;
  const results = await sql`
    SELECT DISTINCT ON (ie.product_id)
      ie.id            AS embedding_id,
      ie.product_id,
      ie.image_url     AS matched_image_url,
      1 - (ie.embedding <=> ${vecStr}::vector) AS similarity,
      p.name, p.price, p.category, p.description, p.images, p.slug,
      u.name AS seller_name, u.username AS seller_username
    FROM image_embeddings ie
    JOIN products p ON ie.product_id = p.id
    JOIN users u    ON p.user_id = u.id
    WHERE p.is_sold = false
      AND 1 - (ie.embedding <=> ${vecStr}::vector) >= ${minSimilarity}
    ORDER BY ie.product_id, ie.embedding <=> ${vecStr}::vector
  `;
  results.sort((a, b) => parseFloat(b.similarity) - parseFloat(a.similarity));
  return results.slice(0, limit);
}

/**
 * LangChain tool: find visually similar products from an already-computed embedding.
 * The embedding is passed in as a JSON array string by the chatbot pipeline
 * (not by the LLM itself); the LLM simply invokes this tool with limit/category.
 */
export const findSimilarByImage = tool(
  async ({ embeddingJson, category, limit = 5 }) => {
    try {
      if (!imageEmbeddingsConfig.enabled) {
        return JSON.stringify({
          error: "Image search is not configured on this server.",
        });
      }

      let embedding;
      try {
        embedding = JSON.parse(embeddingJson);
      } catch {
        return JSON.stringify({ error: "Invalid embedding JSON" });
      }

      const rows = await searchByImageEmbedding(embedding, limit);

      if (rows.length === 0) {
        return JSON.stringify({
          found: false,
          message: "No visually similar products found. The image embedding index may be empty.",
          suggestions: [
            "Try a text search instead",
            "Upload a different image",
          ],
        });
      }

      const filtered = category
        ? rows.filter((r) => r.category === category)
        : rows;

      const products = (filtered.length > 0 ? filtered : rows).map((r) => ({
        id: r.product_id,
        name: r.name,
        price: parseFloat(r.price),
        category: r.category,
        description: r.description?.substring(0, 150) + (r.description?.length > 150 ? "..." : ""),
        similarity: parseFloat(r.similarity).toFixed(3),
        seller: r.seller_name,
        sellerUsername: r.seller_username,
        matchedImageUrl: r.matched_image_url,
      }));

      return JSON.stringify({ found: true, count: products.length, products });
    } catch (error) {
      console.error("Error in findSimilarByImage:", error);
      return JSON.stringify({ error: "Image similarity search failed", details: error.message });
    }
  },
  {
    name: "findSimilarByImage",
    description: "Find products visually similar to an uploaded image. Uses pre-computed image embeddings and pgvector cosine similarity.",
    schema: z.object({
      embeddingJson: z.string().describe("JSON-stringified 1408-dim embedding array (injected by system)"),
      category: z.string().optional().describe("Optional category filter"),
      limit: z.number().optional().describe("Max results (default 5)"),
    }),
  }
);

export const buyerTools = [
  searchProducts,
  browseByCategory,
  compareListings,
  checkPriceFairness,
  getRecommendations,
  findSimilarByImage,
];

export default buyerTools;
