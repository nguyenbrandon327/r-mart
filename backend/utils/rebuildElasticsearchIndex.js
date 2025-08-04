import { esClient, PRODUCT_INDEX, productIndexConfig } from '../config/elasticsearch.js';
import { sql } from '../config/db.js';
import { syncProductsToElasticsearch } from '../controllers/searchController.js';

/**
 * Rebuild the Elasticsearch index with updated mapping
 */
async function rebuildElasticsearchIndex() {
  try {
    console.log('🔄 Starting Elasticsearch index rebuild...');
    
    // Check if index exists and delete it
    const indexExists = await esClient.indices.exists({ index: PRODUCT_INDEX });
    if (indexExists) {
      console.log(`🗑️  Deleting existing index: ${PRODUCT_INDEX}`);
      await esClient.indices.delete({ index: PRODUCT_INDEX });
    }
    
    // Create new index with updated mapping
    console.log('🆕 Creating new index with updated mapping...');
    await esClient.indices.create({
      index: PRODUCT_INDEX,
      body: productIndexConfig
    });
    
    console.log('✅ New index created successfully!');
    
    // Get all products from database
    console.log('📦 Fetching products from database...');
    const products = await sql`
      SELECT p.*, u.name as user_name, u.email as user_email, u.profile_pic as user_profile_pic
      FROM products p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.id
    `;
    
    console.log(`Found ${products.length} products to index`);
    
    if (products.length === 0) {
      console.log('No products found to index');
      return;
    }
    
    // Re-sync all products to Elasticsearch
    await syncProductsToElasticsearch(products);
    
    console.log('✅ Successfully rebuilt Elasticsearch index!');
    console.log('🔍 Search suggestions and search functionality should now work properly.');
    
  } catch (error) {
    console.error('❌ Failed to rebuild Elasticsearch index:', error);
    throw error;
  }
}

// Run the rebuild if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  rebuildElasticsearchIndex()
    .then(() => {
      console.log('Index rebuild completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Index rebuild failed:', error);
      process.exit(1);
    });
}

export { rebuildElasticsearchIndex };