import { meiliClient, PRODUCT_INDEX, initializeMeiliSearch } from '../config/meilisearch.js';
import { sql } from '../config/db.js';
import { syncProductsToMeiliSearch } from '../controllers/searchController.js';

/**
 * Rebuild the MeiliSearch index with updated settings
 */
async function rebuildMeilisearchIndex() {
  try {
    console.log('🔄 Starting MeiliSearch index rebuild...');
    console.log('🔌 Connecting to MeiliSearch...');
    
    // Check if index exists and delete it
    try {
      const index = meiliClient.index(PRODUCT_INDEX);
      const stats = await index.getStats(); 
      console.log(`📊 Found existing index '${PRODUCT_INDEX}' with ${stats.numberOfDocuments} documents`);
      console.log(`🗑️  Deleting existing index: ${PRODUCT_INDEX}`);
      await meiliClient.deleteIndex(PRODUCT_INDEX);
      
      // Wait a moment for the deletion to complete
      console.log('⏳ Waiting for index deletion to complete...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      if (error.code === 'index_not_found') {
        console.log('ℹ️  Index does not exist, will create new one...');
      } else {
        console.log('⚠️  Could not check existing index, proceeding with creation...');
      }
    }
    
    // Create new index with updated settings
    console.log('🆕 Creating new index with updated settings...');
    await initializeMeiliSearch();
    
    console.log('✅ New index created and configured successfully!');
    
    // Get all products from database
    console.log('📊 Fetching products from database...');
    const products = await sql`
      SELECT p.*, u.name as user_name, u.email as user_email, u.profile_pic as user_profile_pic
      FROM products p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.id
    `;
    
    console.log(`📦 Found ${products.length} products to index`);
    
    if (products.length === 0) {
      console.log('ℹ️  No products found to index - rebuild complete');
      return;
    }

    // Show first few product names for verification
    console.log('📋 Sample products to index:');
    products.slice(0, 3).forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} (ID: ${product.id})`);
    });
    if (products.length > 3) {
      console.log(`   ... and ${products.length - 3} more products`);
    }
    
    // Re-sync all products to MeiliSearch
    console.log('📤 Starting product indexing...');
    await syncProductsToMeiliSearch(products);
    
    console.log('✅ Successfully rebuilt MeiliSearch index!');
    console.log(`📈 Total products indexed: ${products.length}`);
    console.log('🔍 Search suggestions and search functionality should now work properly.');
    console.log('🧠 AI-powered semantic search with OpenAI embeddings is now available.');
    console.log('💡 Note: Embeddings will be generated automatically as products are indexed.');
    
  } catch (error) {
    console.error('❌ Failed to rebuild MeiliSearch index:', error);
    console.error('💡 Check your .env file has: MEILISEARCH_URL, MEILISEARCH_API_KEY, and OPENAI_API_KEY');
    throw error;
  }
}

// Run the rebuild if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname || process.argv[1].endsWith('rebuildMeilisearchIndex.js')) {
  console.log('🚀 Starting MeiliSearch index rebuild from command line...');
  rebuildMeilisearchIndex()
    .then(() => {
      console.log('🎉 Index rebuild completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Index rebuild failed:', error);
      process.exit(1);
    });
}

export { rebuildMeilisearchIndex };
