import { sql } from "../config/db.js";

/**
 * Generate a URL-safe slug from a string
 * @param {string} text - The text to convert to a slug
 * @returns {string} - URL-safe slug
 */
export function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    // Replace spaces and special characters with hyphens
    .replace(/[\s\W-]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length to reasonable size
    .substring(0, 100);
}

/**
 * Generate a unique slug for a product, handling duplicates by appending numbers
 * @param {string} name - The product name
 * @param {number} excludeProductId - Product ID to exclude from duplicate check (for updates)
 * @returns {Promise<string>} - Unique slug
 */
export async function generateUniqueSlug(name, excludeProductId = null) {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    try {
      // Check if slug already exists (excluding the current product if updating)
      let existingProduct;
      
      if (excludeProductId) {
        existingProduct = await sql`
          SELECT id FROM products 
          WHERE slug = ${slug} AND id != ${excludeProductId}
          LIMIT 1
        `;
      } else {
        existingProduct = await sql`
          SELECT id FROM products 
          WHERE slug = ${slug}
          LIMIT 1
        `;
      }
      
      // If no existing product found, this slug is unique
      if (existingProduct.length === 0) {
        return slug;
      }
      
      // If slug exists, try the next variant
      counter++;
      slug = `${baseSlug}-${counter}`;
      
      // Prevent infinite loops (very unlikely but safe)
      if (counter > 1000) {
        // Fallback: append timestamp
        slug = `${baseSlug}-${Date.now()}`;
        return slug;
      }
      
    } catch (error) {
      console.error('Error checking slug uniqueness:', error);
      // Fallback: append timestamp on error
      return `${baseSlug}-${Date.now()}`;
    }
  }
}

/**
 * Update existing products to have slugs
 * This function is used for migration purposes
 */
export async function populateExistingSlugs() {
  try {
    console.log('Starting to populate existing product slugs...');
    
    // Get all products without slugs
    const products = await sql`
      SELECT id, name FROM products 
      WHERE slug IS NULL OR slug = ''
      ORDER BY id
    `;
    
    console.log(`Found ${products.length} products without slugs`);
    
    for (const product of products) {
      const slug = await generateUniqueSlug(product.name);
      
      await sql`
        UPDATE products 
        SET slug = ${slug} 
        WHERE id = ${product.id}
      `;
      
      console.log(`Generated slug "${slug}" for product "${product.name}" (ID: ${product.id})`);
    }
    
    console.log('Successfully populated all product slugs');
    return true;
  } catch (error) {
    console.error('Error populating existing slugs:', error);
    throw error;
  }
}