import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

dotenv.config();

// Create Elasticsearch client
export const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || ''
  }
});

// Product index settings and mappings
export const PRODUCT_INDEX = 'products';

export const productIndexConfig = {
  settings: {
    analysis: {
      analyzer: {
        text_analyzer: {
          type: 'standard',
          stopwords: '_english_'
        }
      }
    }
  },
  mappings: {
    properties: {
      id: { type: 'keyword' },
      name: { 
        type: 'text',
        analyzer: 'text_analyzer',
        fields: {
          keyword: { type: 'keyword' },
          suggest: { 
            type: 'completion',
            analyzer: 'standard'
          }
        }
      },
      description: { 
        type: 'text',
        analyzer: 'text_analyzer'
      },
      price: { type: 'float' },
      category: { type: 'keyword' },
      images: { type: 'keyword' },
      slug: { type: 'keyword' },
      is_sold: { type: 'boolean' },
      user_id: { type: 'keyword' },
      user_name: { type: 'text' },
      user_email: { type: 'keyword' },
      created_at: { type: 'date' },
      updated_at: { type: 'date' }
    }
  }
};

// Initialize Elasticsearch index
export const initializeElasticsearch = async () => {
  try {
    // Check if index exists
    const indexExists = await esClient.indices.exists({ index: PRODUCT_INDEX });
    
    if (!indexExists) {
      // Create index with settings and mappings
      await esClient.indices.create({
        index: PRODUCT_INDEX,
        body: productIndexConfig
      });
      console.log(`Elasticsearch index '${PRODUCT_INDEX}' created successfully`);
    } else {
      console.log(`Elasticsearch index '${PRODUCT_INDEX}' already exists`);
    }
    
    // Test connection
    const health = await esClient.cluster.health();
    console.log('Elasticsearch cluster health:', health);
    
  } catch (error) {
    console.error('Error initializing Elasticsearch:', error);
    throw error;
  }
}; 