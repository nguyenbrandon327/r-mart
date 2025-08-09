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
      revision: "1",
      apiKey: process.env.OPENAI_API_KEY || "",
      documentTemplate: `{{doc.name}} {{doc.description}} {{doc.category}}`,
      inputField: ["name", "description", "category"],
      inputType: "textField",
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
    
    // Get or create the index
    const index = meiliClient.index(PRODUCT_INDEX);
    
    try {
      // Try to get existing index stats
      const stats = await index.getStats();
      console.log(`📊 MeiliSearch index '${PRODUCT_INDEX}' exists with ${stats.numberOfDocuments} documents`);
    } catch (error) {
      if (error.code === 'index_not_found') {
        console.log(`📝 Creating MeiliSearch index '${PRODUCT_INDEX}'...`);
        await meiliClient.createIndex(PRODUCT_INDEX, { primaryKey: 'id' });
      } else {
        throw error;
      }
    }
    
    // Configure the index settings
    console.log('⚙️  Configuring MeiliSearch index settings...');
    
    // Update searchable attributes
    await index.updateSearchableAttributes(productIndexConfig.searchableAttributes);
    
    // Update filterable attributes
    await index.updateFilterableAttributes(productIndexConfig.filterableAttributes);
    
    // Update sortable attributes
    await index.updateSortableAttributes(productIndexConfig.sortableAttributes);
    
    // Update displayed attributes
    await index.updateDisplayedAttributes(productIndexConfig.displayedAttributes);
    
    // Update ranking rules
    await index.updateRankingRules(productIndexConfig.rankingRules);
    
    // Update typo tolerance
    await index.updateTypoTolerance(productIndexConfig.typoTolerance);
    
    // Update synonyms
    console.log('📝 Updating synonyms for enhanced search...');
    await index.updateSynonyms(productIndexConfig.synonyms);
    console.log(`✅ Applied ${Object.keys(productIndexConfig.synonyms).length} synonym groups`);
    
    // Update stop words
    await index.updateStopWords(productIndexConfig.stopWords);
    
    // Update pagination settings
    await index.updatePagination(productIndexConfig.pagination);
    
    // Configure embedders for semantic search
    console.log('🧠 Configuring AI embedders for semantic search...');
    await index.updateEmbedders(productIndexConfig.embedders);
    console.log('✅ OpenAI embedders configured with text-embedding-3-small');
    
    console.log('✅ MeiliSearch index configuration completed successfully');
    console.log('🔍 Hybrid search (keyword + semantic) is now enabled');
    
    return index;
    
  } catch (error) {
    console.error('❌ Error initializing MeiliSearch:', error);
    throw error;
  }
};

// Get MeiliSearch index
export const getProductsIndex = () => {
  return meiliClient.index(PRODUCT_INDEX);
};
