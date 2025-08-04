import { sql } from '../config/db.js';
import { syncProductsToElasticsearch } from '../controllers/searchController.js';

/**
 * Re-index all products in Elasticsearch with updated slug information
 */
async function reindexAllProducts() {
  try {
    console.log('🔄 Starting to re-index all products with slug information...');
    
    // Get all products with their slug information
    const products = await sql`
      SELECT p.*, u.name as user_name, u.email as user_email, u.profile_pic as user_profile_pic
      FROM products p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.id
    `;
    
    console.log(`Found ${products.length} products to re-index`);
    
    if (products.length === 0) {
      console.log('No products found to re-index');
      return;
    }
    
    // Re-sync all products to Elasticsearch
    await syncProductsToElasticsearch(products);
    
    console.log('✅ Successfully re-indexed all products with slug information!');
    console.log('Search results will now include product slugs for proper URL generation.');
    
  } catch (error) {
    console.error('❌ Failed to re-index products:', error);
    throw error;
  }
}

// Run the re-indexing if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  reindexAllProducts()
    .then(() => {
      console.log('Re-indexing completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Re-indexing failed:', error);
      process.exit(1);
    });
}

export { reindexAllProducts };