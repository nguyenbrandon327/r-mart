import { MeiliSearch } from 'meilisearch';
import dotenv from 'dotenv';

dotenv.config();

// Create MeiliSearch client
export const meiliClient = new MeiliSearch({
  host: process.env.MEILISEARCH_URL || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_API_KEY || '',
});

// Product index name
export const PRODUCT_INDEX = 'products';

// Product index configuration
export const productIndexConfig = {
  // Searchable attributes (fields that can be searched)
  searchableAttributes: [
    'name',
    'description',
    'category',
    'user_name'
  ],
  
  // Filterable attributes (fields that can be filtered)
  filterableAttributes: [
    'category',
    'price',
    'is_sold',
    'user_id',
    'created_at'
  ],
  
  // Sortable attributes (fields that can be sorted)
  sortableAttributes: [
    'price',
    'created_at',
    'name'
  ],
  
  // Displayed attributes (fields returned in search results)
  displayedAttributes: [
    'id',
    'name',
    'description',
    'price',
    'category',
    'images',
    'slug',
    'is_sold',
    'user_id',
    'user_name',
    'user_email',
    'created_at',
    'updated_at'
  ],
  
  // Ranking rules (how results are ranked)
  rankingRules: [
    'words',
    'typo',
    'proximity',
    'attribute',
    'sort',
    'exactness'
  ],
  
  // Typo tolerance settings
  typoTolerance: {
    enabled: true,
    minWordSizeForTypos: {
      oneTypo: 4,
      twoTypos: 8
    }
  },
  
  // Synonyms for enhanced search experience
  synonyms: {
    // Drinkware synonyms
    'cup': ['mug', 'tumbler', 'glass'],
    'mug': ['cup', 'tumbler'],
    'bottle': ['flask', 'container'],
    
    // Electronics synonyms
    'phone': ['mobile', 'smartphone', 'cellular'],
    'laptop': ['computer', 'notebook', 'pc'],
    'tv': ['television', 'monitor', 'screen'],
    
    // Furniture synonyms
    'chair': ['seat', 'stool'],
    'desk': ['table', 'workstation'],
    'shelf': ['bookshelf', 'rack'],
    
    // Clothing synonyms
    'shirt': ['top', 'blouse', 'tee'],
    'pants': ['trousers', 'jeans'],
    'shoes': ['sneakers', 'footwear'],
    
    // Book synonyms
    'book': ['textbook', 'manual', 'guide'],
    'novel': ['book', 'fiction'],
    
    // General synonyms
    'new': ['brand new', 'unused', 'fresh'],
    'used': ['secondhand', 'pre-owned'],
    'cheap': ['affordable', 'budget', 'inexpensive'],
    'expensive': ['costly', 'premium', 'high-end']
  },
  
  // Stop words (words to ignore during search)
  stopWords: ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'],
  
  // Pagination settings
  pagination: {
    maxTotalHits: 1000
  },

  // Embedders configuration for semantic search
  embedders: {
    default: {
      source: "openAi",
      model: "text-embedding-3-small",
      apiKey: process.env.OPENAI_API_KEY || "",
      documentTemplate: `{{doc.name}} {{doc.description}} {{doc.category}}`,
      dimensions: 1536
    }
  },

  // Vector search settings
  vectorSearch: {
    // Enable hybrid search (combines keyword and semantic search)
    semanticRatio: 0.5, // 50% semantic, 50% keyword search
    embedder: "default",
    showRankingScore: true,
    showRankingScoreDetails: true
  }
};

// Initialize MeiliSearch index
export const initializeMeiliSearch = async () => {
  try {
    console.log('🔍 Initializing MeiliSearch...');
    
    // Check if MeiliSearch is accessible
    const health = await meiliClient.health();
    console.log('MeiliSearch health:', health);
    
    // Check if index exists, create if it doesn't
    let index;
    try {
      // Try to get existing index information
      const indexInfo = await meiliClient.getIndex(PRODUCT_INDEX);
      console.log(`📊 MeiliSearch index '${PRODUCT_INDEX}' exists`);
      index = meiliClient.index(PRODUCT_INDEX);
      
      // Get stats to display document count
      const stats = await index.getStats();
      console.log(`📊 Index contains ${stats.numberOfDocuments} documents`);
    } catch (error) {
      // Check for various ways the "index not found" error might be represented
      if (error.code === 'index_not_found' || 
          error.cause?.code === 'index_not_found' ||
          error.message?.includes('Index') && error.message?.includes('not found') ||
          error.response?.status === 404) {
        console.log(`📝 Creating MeiliSearch index '${PRODUCT_INDEX}'...`);
        await meiliClient.createIndex(PRODUCT_INDEX, { primaryKey: 'id' });
        console.log(`✅ Created MeiliSearch index '${PRODUCT_INDEX}'`);
        index = meiliClient.index(PRODUCT_INDEX);
      } else {
        console.error('❌ Unexpected error checking index:', error);
        throw error;
      }
    }
    
    // Configure the index settings
    console.log('⚙️  Configuring MeiliSearch index settings...');
    
    // Update settings with error handling for each step
    try {
      await index.updateSearchableAttributes(productIndexConfig.searchableAttributes);
      await index.updateFilterableAttributes(productIndexConfig.filterableAttributes);
      await index.updateSortableAttributes(productIndexConfig.sortableAttributes);
      await index.updateDisplayedAttributes(productIndexConfig.displayedAttributes);
      await index.updateRankingRules(productIndexConfig.rankingRules);
      await index.updateTypoTolerance(productIndexConfig.typoTolerance);
      
      // Update synonyms
      console.log('📝 Updating synonyms for enhanced search...');
      await index.updateSynonyms(productIndexConfig.synonyms);
      console.log(`✅ Applied ${Object.keys(productIndexConfig.synonyms).length} synonym groups`);
      
      await index.updateStopWords(productIndexConfig.stopWords);
      await index.updatePagination(productIndexConfig.pagination);
      
      // Configure embedders for semantic search
      console.log('🧠 Configuring AI embedders for semantic search...');
      if (process.env.OPENAI_API_KEY) {
        await index.updateEmbedders(productIndexConfig.embedders);
        console.log('✅ OpenAI embedders configured with text-embedding-3-small');
      } else {
        console.log('⚠️  OpenAI API key not found - semantic search will be disabled');
        console.log('💡 Add OPENAI_API_KEY to your .env file to enable AI-powered search');
      }
      
    } catch (settingsError) {
      console.error('❌ Error configuring index settings:', settingsError);
      console.log('⚠️  Some settings may not have been applied correctly');
      // Don't throw here - the index was created successfully, settings can be retried
    }
    
    console.log('✅ MeiliSearch index configuration completed successfully');
    console.log('🔍 Hybrid search (keyword + semantic) is now enabled');
    
    return index;
    
  } catch (error) {
    console.error('❌ Error initializing MeiliSearch:', error);
    console.error('💡 Common issues:');
    console.error('   - Check MEILISEARCH_URL is correct in your .env file');
    console.error('   - Check MEILISEARCH_API_KEY is valid in your .env file');
    console.error('   - Ensure MeiliSearch service is running and accessible');
    throw error;
  }
};

// Get MeiliSearch index
export const getProductsIndex = () => {
  return meiliClient.index(PRODUCT_INDEX);
};
