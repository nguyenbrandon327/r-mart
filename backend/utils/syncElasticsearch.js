import { sql } from '../config/db.js';
import { initializeElasticsearch } from '../config/elasticsearch.js';
import { syncProductsToElasticsearch } from '../controllers/searchController.js';

export const syncExistingProducts = async () => {
  try {
    console.log('Starting Elasticsearch sync...');
    
    // Initialize Elasticsearch
    await initializeElasticsearch();
    
    // Fetch all products with user info
    const products = await sql`
      SELECT p.*, u.name as user_name, u.email as user_email, u.profile_pic as user_profile_pic
      FROM products p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `;
    
    console.log(`Found ${products.length} products to sync`);
    
    if (products.length > 0) {
      // Sync products in batches of 100
      const batchSize = 100;
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        await syncProductsToElasticsearch(batch);
        console.log(`Synced batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(products.length / batchSize)}`);
      }
    }
    
    console.log('Elasticsearch sync completed successfully');
    return true;
  } catch (error) {
    console.error('Error syncing products to Elasticsearch:', error);
    return false;
  }
};

// Run sync if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  syncExistingProducts()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} 