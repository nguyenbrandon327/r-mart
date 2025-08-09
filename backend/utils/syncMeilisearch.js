import { sql } from '../config/db.js';
import { initializeMeiliSearch } from '../config/meilisearch.js';
import { syncProductsToMeiliSearch } from '../controllers/searchController.js';

export const syncExistingProducts = async () => {
  try {
    console.log('🔄 Starting MeiliSearch sync...');
    console.log('🔌 Connecting to MeiliSearch...');
    
    // Initialize MeiliSearch
    await initializeMeiliSearch();
    console.log('✅ MeiliSearch connection successful!');
    
    // Fetch all products with user info
    console.log('📊 Fetching products from database...');
    const products = await sql`
      SELECT p.*, u.name as user_name, u.email as user_email, u.profile_pic as user_profile_pic
      FROM products p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `;
    
    console.log(`📦 Found ${products.length} products to sync`);
    
    if (products.length === 0) {
      console.log('ℹ️  No products found in database to sync');
      return true;
    }

    // Show first few product names for verification
    console.log('📋 Sample products to sync:');
    products.slice(0, 3).forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} (ID: ${product.id})`);
    });
    if (products.length > 3) {
      console.log(`   ... and ${products.length - 3} more products`);
    }
    
    // Sync products in batches of 100
    const batchSize = 100;
    console.log(`🔄 Starting sync in batches of ${batchSize}...`);
    
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(products.length / batchSize);
      
      console.log(`📤 Syncing batch ${batchNumber} of ${totalBatches} (${batch.length} products)...`);
      
      await syncProductsToMeiliSearch(batch);
      
      console.log(`✅ Batch ${batchNumber} synced successfully!`);
    }
    
    console.log('🎉 MeiliSearch sync completed successfully!');
    console.log(`📈 Total products synced: ${products.length}`);
    console.log('🧠 AI-powered semantic search with OpenAI embeddings is now available.');
    return true;
  } catch (error) {
    console.error('❌ Error syncing products to MeiliSearch:', error);
    console.error('💡 Check your .env file has: MEILISEARCH_URL, MEILISEARCH_API_KEY, and OPENAI_API_KEY');
    return false;
  }
};

// Run sync if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname || process.argv[1].endsWith('syncMeilisearch.js')) {
  console.log('🚀 Starting MeiliSearch sync from command line...');
  syncExistingProducts()
    .then(() => {
      console.log('✅ Sync completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Sync failed:', error);
      process.exit(1);
    });
}
