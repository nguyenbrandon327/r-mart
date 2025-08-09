#!/usr/bin/env node

/**
 * Test script for AI-powered hybrid search functionality
 * Run this after setting up embedders to verify everything works
 */

import { meiliClient, PRODUCT_INDEX, getProductsIndex } from '../config/meilisearch.js';
import dotenv from 'dotenv';

dotenv.config();

async function testHybridSearch() {
  console.log('🧪 Testing AI-Powered Hybrid Search Implementation...\n');

  try {
    // Test 1: Check MeiliSearch connection
    console.log('📡 Test 1: MeiliSearch Connection');
    const health = await meiliClient.health();
    console.log('✅ MeiliSearch is healthy:', health.status);
    console.log('');

    // Test 2: Check index exists and has embedders
    console.log('📊 Test 2: Index Configuration');
    const index = getProductsIndex();
    
    try {
      const stats = await index.getStats();
      console.log(`✅ Index exists with ${stats.numberOfDocuments} documents`);
      
      // Check embedders configuration
      const settings = await index.getSettings();
      if (settings.embedders && settings.embedders.default) {
        console.log('✅ Embedders configured:');
        console.log(`   - Source: ${settings.embedders.default.source}`);
        console.log(`   - Model: ${settings.embedders.default.model}`);
        console.log(`   - Dimensions: ${settings.embedders.default.dimensions}`);
      } else {
        console.log('⚠️  Embedders not found - run rebuildMeilisearchIndex.js first');
      }
    } catch (error) {
      console.log('❌ Index not found or misconfigured');
      console.log('💡 Run: node utils/rebuildMeilisearchIndex.js');
      return;
    }
    console.log('');

    // Test 3: Environment variables
    console.log('🔑 Test 3: Environment Configuration');
    if (process.env.OPENAI_API_KEY) {
      const keyLength = process.env.OPENAI_API_KEY.length;
      console.log(`✅ OpenAI API Key configured (${keyLength} characters)`);
    } else {
      console.log('❌ OPENAI_API_KEY not found in environment');
      console.log('💡 Add OPENAI_API_KEY to your .env file');
    }

    if (process.env.MEILISEARCH_URL && process.env.MEILISEARCH_API_KEY) {
      console.log('✅ MeiliSearch credentials configured');
    } else {
      console.log('❌ MeiliSearch credentials missing');
    }
    console.log('');

    // Test 4: Sample searches (if we have products)
    const stats = await index.getStats();
    if (stats.numberOfDocuments > 0) {
      console.log('🔍 Test 4: Sample Search Queries');
      
      // Test keyword search
      console.log('Testing keyword search...');
      const keywordResults = await index.search('laptop', {
        limit: 3,
        filter: 'is_sold = false'
      });
      console.log(`✅ Keyword search: ${keywordResults.hits.length} results`);

      // Test AI-powered hybrid search (if embedders are available)
      if (process.env.OPENAI_API_KEY) {
        console.log('Testing AI-powered hybrid search...');
        try {
          // Test balanced hybrid search
          const hybridResults = await index.search('study materials', {
            limit: 3,
            filter: 'is_sold = false',
            hybrid: {
              semanticRatio: 0.5,
              embedder: 'default'
            },
            showRankingScore: true
          });
          console.log(`✅ Balanced hybrid search (50/50): ${hybridResults.hits.length} results`);
          
          // Test semantic-focused search
          const semanticResults = await index.search('cozy winter essentials', {
            limit: 2,
            filter: 'is_sold = false',
            hybrid: {
              semanticRatio: 0.8,
              embedder: 'default'
            },
            showRankingScore: true
          });
          console.log(`✅ Semantic-focused search (80/20): ${semanticResults.hits.length} results`);
          
          if (hybridResults.hits.length > 0) {
            console.log('   Sample result scores:');
            hybridResults.hits.slice(0, 2).forEach((hit, idx) => {
              console.log(`   ${idx + 1}. "${hit.name}" - Score: ${hit._rankingScore?.toFixed(3) || 'N/A'}`);
            });
          }
        } catch (error) {
          console.log('⚠️  Hybrid search failed - embeddings may not be ready yet');
          console.log('💡 Wait a few minutes for embeddings to generate, then try again');
        }
      }
    } else {
      console.log('ℹ️  No products in index - seed some data first');
    }
    console.log('');

    // Test 5: Embedder status check
    console.log('🤖 Test 5: Embedder Status');
    try {
      const tasks = await meiliClient.getTasks({ 
        types: ['settingsUpdate'],
        limit: 5 
      });
      
      const embedderTasks = tasks.results.filter(task => 
        task.details?.settings?.embedders
      );
      
      if (embedderTasks.length > 0) {
        const latestTask = embedderTasks[0];
        console.log(`✅ Latest embedder task: ${latestTask.status}`);
        console.log(`   - Task ID: ${latestTask.uid}`);
        console.log(`   - Finished at: ${latestTask.finishedAt || 'In progress'}`);
      } else {
        console.log('ℹ️  No embedder configuration tasks found');
      }
    } catch (error) {
      console.log('⚠️  Could not check embedder tasks');
    }

    console.log('\n🎉 Hybrid Search Test Complete!');
    console.log('\n📝 Next Steps:');
    console.log('1. If embedders are not configured, run: node utils/rebuildMeilisearchIndex.js');
    console.log('2. Test the API endpoints:');
    console.log('   - GET /api/search/products?q=study materials (works great out of the box!)');
    console.log('   - GET /api/search/products?q=laptop&category=Electronics (with filters)');
    console.log('3. Check the SEMANTIC_SEARCH_GUIDE.md for usage examples');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure MeiliSearch is running and accessible');
    console.log('2. Check your .env file has all required variables');
    console.log('3. Verify your MeiliSearch API key has proper permissions');
    process.exit(1);
  }
}

// Run the test
testHybridSearch()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Test script error:', error);
    process.exit(1);
  });
