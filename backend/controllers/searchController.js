import { meiliClient, PRODUCT_INDEX, getProductsIndex } from '../config/meilisearch.js';
import { sql } from '../config/db.js';
import { calculateDistance, getUserCoordinates } from '../utils/distanceCalculator.js';

// Search products using AI-powered hybrid search
export const searchProducts = async (req, res) => {
  try {
    const { 
      q, 
      category, 
      minPrice, 
      maxPrice, 
      sort = 'best_match', 
      limit = 20, 
      offset = 0,
      semanticRatio = 0.5     // ratio for hybrid search (0 = pure keyword, 1 = pure semantic)
    } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Handle distance-based search separately
    if (sort === 'distance') {
      return await searchProductsByDistance(req, res);
    }

    const index = getProductsIndex();

    // Build filter string for MeiliSearch
    const filters = ['is_sold = false'];
    
    // Add category filter if provided
    if (category) {
      filters.push(`category = "${category}"`);
    }

    // Add price range filter if provided
    if (minPrice && maxPrice) {
      filters.push(`price >= ${parseFloat(minPrice)} AND price <= ${parseFloat(maxPrice)}`);
    } else if (minPrice) {
      filters.push(`price >= ${parseFloat(minPrice)}`);
    } else if (maxPrice) {
      filters.push(`price <= ${parseFloat(maxPrice)}`);
    }

    // Determine sort order for MeiliSearch
    let sortArray = [];
    switch (sort) {
      case 'recent_first':
        sortArray = ['created_at:desc'];
        break;
      case 'price_low_high':
        sortArray = ['price:asc'];
        break;
      case 'price_high_low':
        sortArray = ['price:desc'];
        break;
      case 'best_match':
      default:
        // MeiliSearch uses relevance by default, we can add created_at as secondary sort
        sortArray = ['created_at:desc'];
        break;
    }

    // Execute the search with AI-powered hybrid capabilities
    const searchOptions = {
      filter: filters.join(' AND '),
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributesToRetrieve: ['*'],
      attributesToHighlight: ['name', 'description'],
      showRankingScore: true,
      showRankingScoreDetails: true,
      // Always use hybrid search combining keyword and semantic
      hybrid: {
        semanticRatio: parseFloat(semanticRatio),
        embedder: 'default'
      }
    };

    // Add sort only if not best_match (MeiliSearch handles relevance automatically)
    if (sort !== 'best_match') {
      searchOptions.sort = sortArray;
    }

    const searchResult = await index.search(q, searchOptions);

    // Format the response to include ranking scores and search metadata
    const products = searchResult.hits.map(hit => {
      // Remove MeiliSearch-specific fields and add score information
      const product = { ...hit };
      delete product._formatted;
      
      // Include ranking information for debugging and optimization
      if (hit._rankingScore !== undefined) {
        product._searchScore = hit._rankingScore;
      }
      if (hit._rankingScoreDetails) {
        product._scoreDetails = hit._rankingScoreDetails;
      }
      
      return product;
    });

    res.status(200).json({
      success: true,
      data: products,
      total: searchResult.estimatedTotalHits,
      limit: parseInt(limit),
      offset: parseInt(offset),
      searchMetadata: {
        hybridSearch: true,
        semanticRatio: parseFloat(semanticRatio),
        processingTimeMs: searchResult.processingTimeMs,
        query: q
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search products',
      error: error.message
    });
  }
};

// Search products with distance-based sorting
const searchProductsByDistance = async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, maxDistance = 50, limit = 20, offset = 0 } = req.query;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required for distance-based searching"
      });
    }

    // Get current user's location
    const [currentUser] = await sql`
      SELECT location_type, campus_location_name, custom_latitude, custom_longitude
      FROM users 
      WHERE id = ${currentUserId}
    `;

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const userCoordinates = getUserCoordinates(currentUser);
    if (!userCoordinates) {
      return res.status(400).json({
        success: false,
        message: "User location not set. Please update your location in profile settings."
      });
    }

    // First get products from database with location data
    let products;
    if (category) {
      products = await sql`
        SELECT p.*, 
               u.name as user_name, u.email as user_email, u.profile_pic as user_profile_pic,
               u.location_type, u.campus_location_name, u.custom_latitude, u.custom_longitude
        FROM products p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.is_sold = false AND p.category = ${category}
      `;
    } else {
      products = await sql`
        SELECT p.*, 
               u.name as user_name, u.email as user_email, u.profile_pic as user_profile_pic,
               u.location_type, u.campus_location_name, u.custom_latitude, u.custom_longitude
        FROM products p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.is_sold = false
      `;
    }

    // Calculate distances and filter by maxDistance
    const productsWithDistance = [];

    for (const product of products) {
      const sellerCoordinates = getUserCoordinates({
        location_type: product.location_type,
        campus_location_name: product.campus_location_name,
        custom_latitude: product.custom_latitude,
        custom_longitude: product.custom_longitude
      });

      if (sellerCoordinates) {
        const distance = calculateDistance(
          userCoordinates.latitude,
          userCoordinates.longitude,
          sellerCoordinates.latitude,
          sellerCoordinates.longitude
        );

        if (distance <= maxDistance) {
          productsWithDistance.push({
            ...product,
            distance: distance,
            seller_location: product.location_type === 'on_campus' 
              ? product.campus_location_name 
              : 'Off-campus'
          });
        }
      }
    }

    // Now filter by search query using JavaScript (since we need location data)
    let filteredProducts = productsWithDistance.filter(product => {
      const searchText = `${product.name} ${product.description}`.toLowerCase();
      const queryLower = q.toLowerCase();
      return searchText.includes(queryLower);
    });

    // Apply price filters
    if (minPrice) {
      filteredProducts = filteredProducts.filter(product => product.price >= parseFloat(minPrice));
    }
    if (maxPrice) {
      filteredProducts = filteredProducts.filter(product => product.price <= parseFloat(maxPrice));
    }

    // Sort by distance
    filteredProducts.sort((a, b) => a.distance - b.distance);

    // Apply pagination
    const total = filteredProducts.length;
    const paginatedProducts = filteredProducts.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.status(200).json({
      success: true,
      data: paginatedProducts,
      total: total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Distance search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search products by distance',
      error: error.message
    });
  }
};

// Get search suggestions (autocomplete)
export const getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Query is required'
      });
    }

    const index = getProductsIndex();

    // Use MeiliSearch search with specific settings for suggestions
    const searchResult = await index.search(q, {
      limit: 10,
      filter: 'is_sold = false',
      attributesToRetrieve: ['name'],
      attributesToHighlight: [],
      showMatchesPosition: false
    });

    // Extract unique product names as suggestions
    const suggestions = [...new Set(searchResult.hits.map(hit => hit.name))].slice(0, 10);
    
    res.status(200).json({
      success: true,
      suggestions: suggestions
    });

  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get search suggestions',
      error: error.message
    });
  }
};

// Index a product in MeiliSearch
export const indexProduct = async (product) => {
  try {
    const index = getProductsIndex();
    
    const document = {
      id: product.id.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      images: product.images,
      slug: product.slug,
      is_sold: product.is_sold || false,
      user_id: product.user_id,
      user_name: product.user_name,
      user_email: product.user_email,
      created_at: new Date(product.created_at).getTime() / 1000, // Convert to timestamp for sorting
      updated_at: new Date(product.updated_at || product.created_at).getTime() / 1000
    };

    await index.addDocuments([document]);
  } catch (error) {
    console.error('Index product error:', error);
    throw error;
  }
};

// Update a product in MeiliSearch
export const updateProductIndex = async (product) => {
  try {
    const index = getProductsIndex();
    
    const document = {
      id: product.id.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      images: product.images,
      slug: product.slug,
      is_sold: product.is_sold,
      updated_at: new Date().getTime() / 1000
    };

    await index.addDocuments([document], { primaryKey: 'id' });
  } catch (error) {
    console.error('Update product index error:', error);
    throw error;
  }
};

// Delete a product from MeiliSearch
export const deleteProductIndex = async (productId) => {
  try {
    const index = getProductsIndex();
    await index.deleteDocument(productId.toString());
  } catch (error) {
    console.error('Delete product index error:', error);
    throw error;
  }
};

// Sync all products from database to MeiliSearch
export const syncProductsToMeiliSearch = async (products) => {
  try {
    const index = getProductsIndex();
    
    console.log(`⚙️  Preparing ${products.length} products for MeiliSearch...`);
    
    const documents = products.map(product => ({
      id: product.id.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      images: product.images,
      slug: product.slug,
      is_sold: product.is_sold || false,
      user_id: product.user_id,
      user_name: product.user_name,
      user_email: product.user_email,
      created_at: new Date(product.created_at).getTime() / 1000, // Convert to timestamp
      updated_at: new Date(product.updated_at || product.created_at).getTime() / 1000
    }));

    console.log(`📤 Sending ${documents.length} documents to MeiliSearch...`);
    
    // Add documents in batches (MeiliSearch handles batching automatically)
    const task = await index.addDocuments(documents, { primaryKey: 'id' });
    
    console.log(`⏳ Waiting for MeiliSearch task ${task.taskUid} to complete...`);
    
    // Wait for the task to complete
    const completedTask = await index.waitForTask(task.taskUid);
    
    if (completedTask.status === 'succeeded') {
      console.log(`✅ Successfully synced ${documents.length} products to MeiliSearch`);
      console.log(`📊 Task completed in ${completedTask.duration || 'unknown'} time`);
    } else {
      console.error(`❌ MeiliSearch task failed with status: ${completedTask.status}`);
      if (completedTask.error) {
        console.error('❌ Task error details:', completedTask.error);
      }
      throw new Error(`MeiliSearch sync failed: ${completedTask.status}`);
    }
    
  } catch (error) {
    console.error('❌ Sync products error:', error);
    throw error;
  }
};