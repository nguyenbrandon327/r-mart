/**
 * Seller Copilot Tools
 * Tools for creating listings, estimating prices, and helping sellers
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { sql } from "../../config/db.js";

/**
 * Search for similar listings to help with pricing
 */
export const searchSimilarListings = tool(
  async ({ query, category, limit = 5 }) => {
    try {
      let results;
      
      if (category) {
        results = await sql`
          SELECT id, name, price, category, description, created_at
          FROM products
          WHERE is_sold = false
            AND category = ${category}
            AND (name ILIKE ${'%' + query + '%'} OR description ILIKE ${'%' + query + '%'})
          ORDER BY created_at DESC
          LIMIT ${limit}
        `;
      } else {
        results = await sql`
          SELECT id, name, price, category, description, created_at
          FROM products
          WHERE is_sold = false
            AND (name ILIKE ${'%' + query + '%'} OR description ILIKE ${'%' + query + '%'})
          ORDER BY created_at DESC
          LIMIT ${limit}
        `;
      }

      if (results.length === 0) {
        return JSON.stringify({
          found: false,
          message: "No similar listings found. This could be a unique item!",
          suggestions: ["Try a broader search", "Check similar categories"]
        });
      }

      const formattedResults = results.map(item => ({
        name: item.name,
        price: parseFloat(item.price),
        category: item.category,
        description: item.description?.substring(0, 100) + "...",
      }));

      const prices = results.map(r => parseFloat(r.price));
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      return JSON.stringify({
        found: true,
        count: results.length,
        priceRange: { min: minPrice, max: maxPrice, average: avgPrice.toFixed(2) },
        listings: formattedResults
      });
    } catch (error) {
      console.error("Error searching similar listings:", error);
      return JSON.stringify({ error: "Failed to search listings", details: error.message });
    }
  },
  {
    name: "searchSimilarListings",
    description: "Search for similar listings to help determine pricing. Returns price ranges and comparable items.",
    schema: z.object({
      query: z.string().describe("Search terms for finding similar items"),
      category: z.string().optional().describe("Category to filter by (e.g., 'Electronics', 'Books')"),
      limit: z.number().optional().describe("Maximum number of results to return (default: 5)")
    })
  }
);

/**
 * Generate a product description based on item details
 */
export const generateDescription = tool(
  async ({ itemName, category, condition, brand, features, defects }) => {
    // This generates a structured description template
    // The actual AI-powered description generation happens in the agent's response
    
    const conditionDescriptions = {
      new: "Brand new, never used",
      like_new: "Like new condition, barely used",
      good: "Good condition with minor signs of use",
      fair: "Fair condition with visible wear",
      poor: "Well-used, functional but shows significant wear"
    };

    const description = {
      title_suggestion: brand ? `${brand} ${itemName}` : itemName,
      description_template: `
**${brand ? brand + ' ' : ''}${itemName}**

📦 **Condition:** ${conditionDescriptions[condition] || condition}

${features ? `✨ **Features:**\n${features.map(f => `- ${f}`).join('\n')}` : ''}

${defects ? `⚠️ **Note:** ${defects}` : ''}

📍 Pickup available on/near UCR campus.
💬 Message me with any questions!
      `.trim(),
      suggested_category: category,
      tips: [
        "Add clear photos from multiple angles",
        "Include measurements if relevant",
        "Mention why you're selling",
        "Respond quickly to messages"
      ]
    };

    return JSON.stringify(description);
  },
  {
    name: "generateDescription",
    description: "Generate a compelling product description template based on item details",
    schema: z.object({
      itemName: z.string().describe("Name of the item"),
      category: z.string().describe("Product category"),
      condition: z.enum(["new", "like_new", "good", "fair", "poor"]).describe("Item condition"),
      brand: z.string().optional().describe("Brand name if applicable"),
      features: z.array(z.string()).optional().describe("List of key features"),
      defects: z.string().optional().describe("Any defects or issues to mention")
    })
  }
);

/**
 * Estimate price for an item based on similar listings and condition
 */
export const estimatePrice = tool(
  async ({ itemName, category, condition, originalPrice, brand }) => {
    try {
      // Search for similar items to get market data
      let results = await sql`
        SELECT price, name, category
        FROM products
        WHERE is_sold = false
          AND category = ${category}
          AND (name ILIKE ${'%' + itemName + '%'} 
               ${brand ? sql`OR name ILIKE ${'%' + brand + '%'}` : sql``})
        ORDER BY created_at DESC
        LIMIT 10
      `;

      // Condition multipliers (percentage of value retained)
      const conditionMultipliers = {
        new: 0.85,      // 85% of original
        like_new: 0.70, // 70% of original
        good: 0.55,     // 55% of original
        fair: 0.40,     // 40% of original
        poor: 0.25      // 25% of original
      };

      const multiplier = conditionMultipliers[condition] || 0.50;

      let estimate = {};

      if (results.length > 0) {
        const prices = results.map(r => parseFloat(r.price));
        const marketAvg = prices.reduce((a, b) => a + b, 0) / prices.length;
        const marketMin = Math.min(...prices);
        const marketMax = Math.max(...prices);

        estimate = {
          marketBased: {
            low: Math.round(marketMin * 0.9),
            suggested: Math.round(marketAvg),
            high: Math.round(marketMax * 1.1),
          },
          basedOn: `${results.length} similar listings`,
        };
      }

      if (originalPrice) {
        const conditionBased = Math.round(originalPrice * multiplier);
        estimate.conditionBased = {
          suggested: conditionBased,
          reasoning: `${condition} condition typically retains ${multiplier * 100}% of original value`
        };
      }

      // Final recommendation
      let finalSuggestion;
      if (estimate.marketBased && estimate.conditionBased) {
        finalSuggestion = Math.round((estimate.marketBased.suggested + estimate.conditionBased.suggested) / 2);
      } else if (estimate.marketBased) {
        finalSuggestion = estimate.marketBased.suggested;
      } else if (estimate.conditionBased) {
        finalSuggestion = estimate.conditionBased.suggested;
      } else {
        finalSuggestion = null;
      }

      return JSON.stringify({
        item: itemName,
        condition,
        estimate,
        finalSuggestion,
        tips: [
          "Price slightly higher to leave room for negotiation",
          "Consider the urgency - lower price = faster sale",
          "Factor in any accessories or extras included"
        ]
      });
    } catch (error) {
      console.error("Error estimating price:", error);
      return JSON.stringify({ error: "Failed to estimate price", details: error.message });
    }
  },
  {
    name: "estimatePrice",
    description: "Estimate a fair selling price based on similar listings and item condition",
    schema: z.object({
      itemName: z.string().describe("Name of the item to price"),
      category: z.string().describe("Product category"),
      condition: z.enum(["new", "like_new", "good", "fair", "poor"]).describe("Item condition"),
      originalPrice: z.number().optional().describe("Original retail price if known"),
      brand: z.string().optional().describe("Brand name if applicable")
    })
  }
);

// Export all seller tools
export const sellerTools = [
  searchSimilarListings,
  generateDescription,
  estimatePrice,
];

export default sellerTools;

