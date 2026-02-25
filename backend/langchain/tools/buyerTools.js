/**
 * Buyer Assistant Tools
 * Tools for searching products, comparing listings, and helping buyers
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { sql } from "../../config/db.js";
import { generateImageEmbedding, imageEmbeddingsConfig } from "../config/embeddings.js";

/**
 * Search products by keywords and filters
 */
export const searchProducts = tool(
  async ({ query, category, minPrice, maxPrice, sortBy = "relevance", limit = 10 }) => {
    try {
      let orderClause;
      switch (sortBy) {
        case "price_low":
          orderClause = sql`ORDER BY p.price ASC`;
          break;
        case "price_high":
          orderClause = sql`ORDER BY p.price DESC`;
          break;
        case "newest":
          orderClause = sql`ORDER BY p.created_at DESC`;
          break;
        default:
          orderClause = sql`ORDER BY p.created_at DESC`;
      }

      // Build the query dynamically
      const results = await sql`
        SELECT 
          p.id, 
          p.name, 
          p.price, 
          p.category, 
          p.description,
          p.images,
          p.created_at,
          u.name as seller_name,
          u.username as seller_username
        FROM products p
        JOIN users u ON p.user_id = u.id
        WHERE p.is_sold = false
          AND (p.name ILIKE ${'%' + query + '%'} OR p.description ILIKE ${'%' + query + '%'})
          ${category ? sql`AND p.category = ${category}` : sql``}
          ${minPrice ? sql`AND p.price >= ${minPrice}` : sql``}
          ${maxPrice ? sql`AND p.price <= ${maxPrice}` : sql``}
        ${orderClause}
        LIMIT ${limit}
      `;

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

      const formattedResults = results.map(item => ({
        id: item.id,
        name: item.name,
        price: parseFloat(item.price),
        category: item.category,
        description: item.description?.substring(0, 150) + (item.description?.length > 150 ? "..." : ""),
        hasImages: item.images && item.images.length > 0,
        imageCount: item.images?.length || 0,
        seller: item.seller_name,
        sellerUsername: item.seller_username,
        postedAt: item.created_at
      }));

      const prices = results.map(r => parseFloat(r.price));
      
      return JSON.stringify({
        found: true,
        count: results.length,
        priceRange: {
          min: Math.min(...prices),
          max: Math.max(...prices),
          average: (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)
        },
        products: formattedResults
      });
    } catch (error) {
      console.error("Error searching products:", error);
      return JSON.stringify({ error: "Failed to search products", details: error.message });
    }
  },
  {
    name: "searchProducts",
    description: "Search for products in the marketplace by keywords and filters",
    schema: z.object({
      query: z.string().describe("Search keywords"),
      category: z.string().optional().describe("Filter by category"),
      minPrice: z.number().optional().describe("Minimum price filter"),
      maxPrice: z.number().optional().describe("Maximum price filter"),
      sortBy: z.enum(["relevance", "price_low", "price_high", "newest"]).optional().describe("Sort order"),
      limit: z.number().optional().describe("Maximum results to return (default: 10)")
    })
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
          p.id, 
          p.name, 
          p.price, 
          p.category, 
          p.description,
          p.images,
          p.created_at,
          u.name as seller_name,
          u.username as seller_username
        FROM products p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ANY(${productIds})
          AND p.is_sold = false
      `;

      if (results.length === 0) {
        return JSON.stringify({
          error: "No products found with the given IDs"
        });
      }

      const comparison = results.map(item => ({
        id: item.id,
        name: item.name,
        price: parseFloat(item.price),
        category: item.category,
        description: item.description,
        hasImages: item.images && item.images.length > 0,
        imageCount: item.images?.length || 0,
        seller: item.seller_name,
        sellerUsername: item.seller_username,
        daysListed: Math.floor((Date.now() - new Date(item.created_at)) / (1000 * 60 * 60 * 24))
      }));

      // Find the best value (lowest price)
      const sortedByPrice = [...comparison].sort((a, b) => a.price - b.price);
      const bestValue = sortedByPrice[0];

      // Find most detailed listing
      const sortedByDescription = [...comparison].sort(
        (a, b) => (b.description?.length || 0) - (a.description?.length || 0)
      );
      const mostDetailed = sortedByDescription[0];

      return JSON.stringify({
        products: comparison,
        analysis: {
          bestValue: {
            id: bestValue.id,
            name: bestValue.name,
            price: bestValue.price,
            reason: "Lowest price"
          },
          mostDetailed: {
            id: mostDetailed.id,
            name: mostDetailed.name,
            reason: "Most detailed description"
          },
          priceRange: {
            lowest: sortedByPrice[0].price,
            highest: sortedByPrice[sortedByPrice.length - 1].price,
            difference: sortedByPrice[sortedByPrice.length - 1].price - sortedByPrice[0].price
          }
        },
        tips: [
          "Consider asking sellers about the item's history",
          "Check if any include accessories or extras",
          "Factor in meetup convenience"
        ]
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
      productIds: z.array(z.number()).describe("Array of product IDs to compare (2-5 products)")
    })
  }
);

/**
 * Check if a price is fair based on market data
 */
export const checkPriceFairness = tool(
  async ({ productId, productName, price, category }) => {
    try {
      // If we have a product ID, get its details
      let targetProduct = null;
      if (productId) {
        const [product] = await sql`
          SELECT name, price, category, description
          FROM products
          WHERE id = ${productId}
        `;
        if (product) {
          targetProduct = product;
          productName = product.name;
          price = parseFloat(product.price);
          category = product.category;
        }
      }

      // Search for similar products
      const similarProducts = await sql`
        SELECT price, name
        FROM products
        WHERE is_sold = false
          AND category = ${category}
          AND name ILIKE ${'%' + productName.split(' ')[0] + '%'}
          ${productId ? sql`AND id != ${productId}` : sql``}
        LIMIT 15
      `;

      if (similarProducts.length < 3) {
        return JSON.stringify({
          analyzed: false,
          message: "Not enough similar listings to determine fair price",
          suggestion: "This might be a unique item - research online for comparable prices"
        });
      }

      const prices = similarProducts.map(p => parseFloat(p.price));
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      // Calculate percentile
      const sortedPrices = [...prices].sort((a, b) => a - b);
      const percentile = (sortedPrices.filter(p => p <= price).length / sortedPrices.length) * 100;

      let verdict;
      let emoji;
      if (price < avgPrice * 0.7) {
        verdict = "Below Market - Great Deal!";
        emoji = "🔥";
      } else if (price < avgPrice * 0.9) {
        verdict = "Below Average - Good Value";
        emoji = "✅";
      } else if (price <= avgPrice * 1.1) {
        verdict = "Fair Price - Market Rate";
        emoji = "👍";
      } else if (price <= avgPrice * 1.3) {
        verdict = "Above Average - Consider Negotiating";
        emoji = "⚠️";
      } else {
        verdict = "Above Market - Try to Negotiate Down";
        emoji = "❌";
      }

      return JSON.stringify({
        analyzed: true,
        product: productName,
        askedPrice: price,
        marketData: {
          average: Math.round(avgPrice),
          min: minPrice,
          max: maxPrice,
          sampleSize: similarProducts.length
        },
        percentile: Math.round(percentile),
        verdict: `${emoji} ${verdict}`,
        suggestion: price > avgPrice 
          ? `Consider offering $${Math.round(avgPrice)} (market average)`
          : "This is a good price - act fast before someone else gets it!"
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
      category: z.string().optional().describe("Product category (if no ID provided)")
    })
  }
);

/**
 * Get product recommendations based on a category or search
 */
export const getRecommendations = tool(
  async ({ category, budget, sortPreference = "value" }) => {
    try {
      let results;
      
      if (category && budget) {
        results = await sql`
          SELECT 
            p.id, p.name, p.price, p.category, p.description, p.created_at,
            u.name as seller_name
          FROM products p
          JOIN users u ON p.user_id = u.id
          WHERE p.is_sold = false
            AND p.category = ${category}
            AND p.price <= ${budget}
          ORDER BY 
            CASE WHEN ${sortPreference} = 'price' THEN p.price END ASC,
            CASE WHEN ${sortPreference} = 'newest' THEN p.created_at END DESC,
            p.created_at DESC
          LIMIT 8
        `;
      } else if (category) {
        results = await sql`
          SELECT 
            p.id, p.name, p.price, p.category, p.description, p.created_at,
            u.name as seller_name
          FROM products p
          JOIN users u ON p.user_id = u.id
          WHERE p.is_sold = false
            AND p.category = ${category}
          ORDER BY p.created_at DESC
          LIMIT 8
        `;
      } else {
        // Get trending/recent items across categories
        results = await sql`
          SELECT 
            p.id, p.name, p.price, p.category, p.description, p.created_at,
            u.name as seller_name
          FROM products p
          JOIN users u ON p.user_id = u.id
          WHERE p.is_sold = false
          ORDER BY p.created_at DESC
          LIMIT 8
        `;
      }

      const recommendations = results.map(item => ({
        id: item.id,
        name: item.name,
        price: parseFloat(item.price),
        category: item.category,
        preview: item.description?.substring(0, 100) + "...",
        seller: item.seller_name,
        isRecent: (Date.now() - new Date(item.created_at)) < (24 * 60 * 60 * 1000) // < 24 hours
      }));

      return JSON.stringify({
        found: recommendations.length > 0,
        count: recommendations.length,
        criteria: { category, budget, sortPreference },
        recommendations,
        tips: budget ? [
          `All items are within your $${budget} budget`,
          "Save items you like to compare later",
          "Message sellers to negotiate"
        ] : [
          "Set a budget to narrow down options",
          "Browse by category for more focused results"
        ]
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
      category: z.string().optional().describe("Category to get recommendations for"),
      budget: z.number().optional().describe("Maximum budget"),
      sortPreference: z.enum(["value", "price", "newest"]).optional().describe("How to sort recommendations")
    })
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
      p.name, p.price, p.category, p.description, p.images,
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

// Export all buyer tools
export const buyerTools = [
  searchProducts,
  compareListings,
  checkPriceFairness,
  getRecommendations,
  findSimilarByImage,
];

export default buyerTools;

