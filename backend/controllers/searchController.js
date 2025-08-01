import { esClient, PRODUCT_INDEX } from '../config/elasticsearch.js';
import { sql } from '../config/db.js';
import { calculateDistance, getUserCoordinates } from '../utils/distanceCalculator.js';

// Search products by title and description
export const searchProducts = async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, sort = 'best_match', limit = 20, offset = 0 } = req.query;

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

    // Build the search query
    const searchQuery = {
      bool: {
        must: [
          {
            multi_match: {
              query: q,
              fields: ['name^2', 'description'], // name field has double weight
              type: 'best_fields',
              fuzziness: 'AUTO'
            }
          }
        ],
        filter: []
      }
    };

    // Add category filter if provided
    if (category) {
      searchQuery.bool.filter.push({
        term: { category: category }
      });
    }

    // Add price range filter if provided
    if (minPrice || maxPrice) {
      const rangeFilter = { range: { price: {} } };
      if (minPrice) rangeFilter.range.price.gte = parseFloat(minPrice);
      if (maxPrice) rangeFilter.range.price.lte = parseFloat(maxPrice);
      searchQuery.bool.filter.push(rangeFilter);
    }

    // Determine sort order
    let sortOrder;
    switch (sort) {
      case 'recent_first':
        sortOrder = [{ created_at: 'desc' }];
        break;
      case 'price_low_high':
        sortOrder = [{ price: 'asc' }];
        break;
      case 'price_high_low':
        sortOrder = [{ price: 'desc' }];
        break;
      case 'best_match':
      default:
        sortOrder = [
          { _score: 'desc' },
          { created_at: 'desc' }
        ];
        break;
    }

    // Execute the search
    const searchResult = await esClient.search({
      index: PRODUCT_INDEX,
      body: {
        query: searchQuery,
        from: parseInt(offset),
        size: parseInt(limit),
        sort: sortOrder
      }
    });

    // Format the response
    const products = searchResult.hits.hits.map(hit => ({
      ...hit._source,
      _score: hit._score
    }));

    res.status(200).json({
      success: true,
      data: products,
      total: searchResult.hits.total.value,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Error in searchProducts:', error);
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
    console.error('Error in searchProductsByDistance:', error);
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

    // Use completion suggester for product names
    const searchResult = await esClient.search({
      index: PRODUCT_INDEX,
      body: {
        suggest: {
          product_suggest: {
            prefix: q,
            completion: {
              field: 'name.keyword',
              size: 10,
              skip_duplicates: true
            }
          }
        },
        _source: false
      }
    });

    // If no completion suggestions, fall back to match query
    if (!searchResult.suggest?.product_suggest?.[0]?.options?.length) {
      const fallbackResult = await esClient.search({
        index: PRODUCT_INDEX,
        body: {
          query: {
            match_phrase_prefix: {
              name: {
                query: q,
                max_expansions: 10
              }
            }
          },
          size: 10,
          _source: ['name']
        }
      });

      const suggestions = fallbackResult.hits.hits.map(hit => hit._source.name);
      return res.status(200).json({
        success: true,
        suggestions: [...new Set(suggestions)] // Remove duplicates
      });
    }

    const suggestions = searchResult.suggest.product_suggest[0].options.map(
      option => option.text
    );

    res.status(200).json({
      success: true,
      suggestions
    });

  } catch (error) {
    console.error('Error in getSearchSuggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get search suggestions',
      error: error.message
    });
  }
};

// Index a product in Elasticsearch
export const indexProduct = async (product) => {
  try {
    await esClient.index({
      index: PRODUCT_INDEX,
      id: product.id.toString(),
      body: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        images: product.images,
        user_id: product.user_id,
        user_name: product.user_name,
        user_email: product.user_email,
        created_at: product.created_at,
        updated_at: product.updated_at || product.created_at
      }
    });
    console.log(`Product ${product.id} indexed in Elasticsearch`);
  } catch (error) {
    console.error('Error indexing product:', error);
    throw error;
  }
};

// Update a product in Elasticsearch
export const updateProductIndex = async (product) => {
  try {
    await esClient.update({
      index: PRODUCT_INDEX,
      id: product.id.toString(),
      body: {
        doc: {
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          images: product.images,
          updated_at: new Date()
        }
      }
    });
    console.log(`Product ${product.id} updated in Elasticsearch`);
  } catch (error) {
    console.error('Error updating product index:', error);
    throw error;
  }
};

// Delete a product from Elasticsearch
export const deleteProductIndex = async (productId) => {
  try {
    await esClient.delete({
      index: PRODUCT_INDEX,
      id: productId.toString()
    });
    console.log(`Product ${productId} deleted from Elasticsearch`);
  } catch (error) {
    console.error('Error deleting product from index:', error);
    throw error;
  }
};

// Sync all products from database to Elasticsearch
export const syncProductsToElasticsearch = async (products) => {
  try {
    const body = products.flatMap(product => [
      { index: { _index: PRODUCT_INDEX, _id: product.id.toString() } },
      {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        images: product.images,
        user_id: product.user_id,
        user_name: product.user_name,
        user_email: product.user_email,
        created_at: product.created_at,
        updated_at: product.updated_at || product.created_at
      }
    ]);

    const bulkResponse = await esClient.bulk({ refresh: true, body });

    if (bulkResponse.errors) {
      const erroredDocuments = [];
      bulkResponse.items.forEach((action, i) => {
        const operation = Object.keys(action)[0];
        if (action[operation].error) {
          erroredDocuments.push({
            status: action[operation].status,
            error: action[operation].error,
            operation: body[i * 2],
            document: body[i * 2 + 1]
          });
        }
      });
      console.error('Failed to sync some products:', erroredDocuments);
    } else {
      console.log(`Successfully synced ${products.length} products to Elasticsearch`);
    }
  } catch (error) {
    console.error('Error syncing products to Elasticsearch:', error);
    throw error;
  }
}; 