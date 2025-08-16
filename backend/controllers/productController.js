import { sql } from "../config/db.js";
import { deleteFileFromS3, getS3KeyFromUrl } from "../utils/s3.js";
import { recordProductView } from "./recentlySeenController.js";
import { indexProduct, updateProductIndex, deleteProductIndex } from "./searchController.js";
import { calculateDistance, getUserCoordinates } from "../utils/distanceCalculator.js";
import { generateUniqueSlug } from "../utils/slugUtils.js";
import crypto from "crypto";


export const getProducts = async (req, res) => {
    try {
        const { excludeRecentlyViewed, sort = 'best_match' } = req.query;
        const userId = req.user?.id; // Get user ID if authenticated
        
        let products;
        let orderClause;
        
        // Determine sort order
        switch (sort) {
            case 'recent_first':
                orderClause = sql`ORDER BY p.created_at DESC`;
                break;
            case 'price_low_high':
                orderClause = sql`ORDER BY p.price ASC`;
                break;
            case 'price_high_low':
                orderClause = sql`ORDER BY p.price DESC`;
                break;
            case 'best_match':
            default:
                // Default behavior - show all unsold products with randomized date-emphasized ordering
                orderClause = sql`ORDER BY (EXTRACT(EPOCH FROM p.created_at) * RANDOM()) DESC`;
                break;
        }
        
        if (excludeRecentlyViewed === 'true' && userId) {
            // Exclude recently viewed products for authenticated users
            products = await sql`
                SELECT p.*, u.name as user_name, u.email as user_email, u.username as user_username, u.profile_pic as user_profile_pic
                FROM products p
                LEFT JOIN users u ON p.user_id = u.id
                WHERE p.is_sold = false AND p.id NOT IN (
                    SELECT DISTINCT product_id 
                    FROM recently_seen_products 
                    WHERE user_id = ${userId}
                )
                ${orderClause}
            `;
        } else {
            products = await sql`
                SELECT p.*, u.name as user_name, u.email as user_email, u.username as user_username, u.profile_pic as user_profile_pic
                FROM products p
                LEFT JOIN users u ON p.user_id = u.id
                WHERE p.is_sold = false
                ${orderClause}
            `;
        }
        
        res.status(200).json({success:true, data:products});
    } catch (error) {
        res.status(500).json({success: false, message: "Failed to fetch products"});
    }
};

export const createProduct = async (req, res) => {
    const {name, price, description, category} = req.body;
    let images = [];

    if (!name || !price || !description || !category) {
        return res.status(400).json({success:false, message: "All fields are required"});
    }

    // Get image URLs from uploaded files
    if (req.files && req.files.length > 0) {
        // Generate the URL manually from the S3 bucket and object key
        const bucketUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;
        images = req.files.map(file => `${bucketUrl}/${file.key}`);
    } else {
        return res.status(400).json({success:false, message: "At least one product image is required"});
    }

    try {
        // Generate unique slug for the product
        const slug = await generateUniqueSlug(name);
        
        const newProduct = await sql`
            INSERT INTO products (name, price, description, images, category, user_id, slug)  
            VALUES (${name}, ${price}, ${description}, ${images}, ${category}, ${req.user.id}, ${slug})
            RETURNING *
        `;



        // Get user info for MeiliSearch
        const userInfo = await sql`
            SELECT name, email, profile_pic 
            FROM users 
            WHERE id = ${req.user.id}
        `;
        
        // Index product in MeiliSearch
        try {
            await indexProduct({
                ...newProduct[0],
                user_name: userInfo[0].name,
                user_email: userInfo[0].email,
                user_profile_pic: userInfo[0].profile_pic
            });
        } catch (esError) {
            // Failed to index product in MeiliSearch - continue even if indexing fails
        }

        res.status(201).json({ success:true, data: newProduct[0] });
    } catch (error) {
        res.status(500).json({success: false, message: "Failed to create product"});
    }
};

export const getProduct = async (req, res) => {
    const { slug } = req.params;

    try {
        // Try to find by slug first, then fallback to ID for backward compatibility
        let product;
        if (slug && isNaN(slug)) {
            // It's a slug (non-numeric)
            product = await sql `
                SELECT p.*, u.name as user_name, u.email as user_email, u.username as user_username, u.profile_pic as user_profile_pic
                FROM products p
                LEFT JOIN users u ON p.user_id = u.id
                WHERE p.slug=${slug}
            `;
        } else {
            // It's an ID (numeric) - for backward compatibility
            product = await sql `
                SELECT p.*, u.name as user_name, u.email as user_email, u.username as user_username, u.profile_pic as user_profile_pic
                FROM products p
                LEFT JOIN users u ON p.user_id = u.id
                WHERE p.id=${slug}
            `;
        }
        
        // Only record views for authenticated users
        // req.user will only exist if the user is logged in via protectRoute middleware
        if (req.user && req.user.id && product.length > 0) {
            // Don't record views if the user is viewing their own product
            if (req.user.id !== product[0].user_id) {
                await recordProductView(req.user.id, product[0].id);
            }
        }
        
        res.status(200).json({ success:true, data:product[0] });
    } catch (error) {
        res.status(500).json({success: false, message: "Failed to fetch product"});
    }
};

export const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, price, description, category, existingImages, newImagePositions } = req.body;
    
    try {
      // First verify the product exists and get its current data
      const existingProduct = await sql`
        SELECT * FROM products WHERE id=${id}
      `;

      if (existingProduct.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Check if the user is the owner of the product
      if (existingProduct[0].user_id && existingProduct[0].user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this product",
        });
      }

      // Start with existing images in their new order
      let finalImages = existingImages ? JSON.parse(existingImages) : [];
      
      // If we have new images to insert
      if (req.files && req.files.length > 0 && newImagePositions) {
        const bucketUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;
        const newImageUrls = req.files.map(file => `${bucketUrl}/${file.key}`);
        const positions = JSON.parse(newImagePositions);
        
        // Create a final ordered array by inserting new images at their specified positions
        const totalImages = finalImages.length + newImageUrls.length;
        const orderedImages = new Array(totalImages);
        
        // First, place existing images in positions not occupied by new images
        let existingIndex = 0;
        let newImageIndex = 0;
        
        for (let i = 0; i < totalImages; i++) {
          if (positions.includes(i)) {
            // This position should have a new image
            orderedImages[i] = newImageUrls[newImageIndex];
            newImageIndex++;
          } else {
            // This position should have an existing image
            if (existingIndex < finalImages.length) {
              orderedImages[i] = finalImages[existingIndex];
              existingIndex++;
            }
          }
        }
        
        finalImages = orderedImages.filter(img => img !== undefined);
      } else if (req.files && req.files.length > 0) {
        // If no position information, append new images to the end (legacy behavior)
        const bucketUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;
        const newImages = req.files.map(file => `${bucketUrl}/${file.key}`);
        finalImages = [...finalImages, ...newImages];
      }

      // Ensure we have at least one image
      if (finalImages.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one product image is required",
        });
      }

      // Generate new slug if name changed
      let slug = existingProduct[0].slug;
      if (name !== existingProduct[0].name) {
        slug = await generateUniqueSlug(name, id);
      }

      const updateProduct = await sql`
        UPDATE products
        SET name=${name}, price=${price}, description=${description}, images=${finalImages}, category=${category}, slug=${slug}
        WHERE id=${id}
        RETURNING *
      `;
      
      // Update product in MeiliSearch
      try {
        await updateProductIndex({
          id: updateProduct[0].id,
          name: updateProduct[0].name,
          description: updateProduct[0].description,
          price: updateProduct[0].price,
          category: updateProduct[0].category,
          images: updateProduct[0].images
        });
      } catch (esError) {
        // Failed to update product in MeiliSearch - continue even if indexing fails
      }
  
      res.status(200).json({ success: true, data: updateProduct[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const deleteProduct = async (req, res) => {
    const { id } = req.params;
  
    try {
      // First verify the product exists and belongs to this user
      const existingProduct = await sql`
        SELECT * FROM products WHERE id=${id}
      `;
  
      if (existingProduct.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }
  
      // Check if the user is the owner of the product
      if (existingProduct[0].user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this product",
        });
      }
      
      // Delete images from S3 if they exist
      if (existingProduct[0].images && existingProduct[0].images.length > 0) {
        for (const imageUrl of existingProduct[0].images) {
          const key = getS3KeyFromUrl(imageUrl);
          if (key) {
            await deleteFileFromS3(key);
          }
        }
      }
  
      // Delete the product
      await sql`
        DELETE FROM products
        WHERE id=${id}
      `;
      
      // Delete product from MeiliSearch
      try {
        await deleteProductIndex(id);
      } catch (esError) {
        // Failed to delete product from MeiliSearch - continue even if deletion fails
      }
  
      res.status(200).json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const getProductsByCategory = async (req, res) => {
    const { category } = req.params;
    const { sort = 'best_match' } = req.query; // Default to best_match
    
    try {
        let products;
        
        switch (sort) {
            case 'recent_first':
                products = await sql`
                    SELECT p.*, u.name as user_name, u.email as user_email, u.username as user_username, u.profile_pic as user_profile_pic
                    FROM products p
                    LEFT JOIN users u ON p.user_id = u.id
                    WHERE p.category=${category} AND p.is_sold = false
                    ORDER BY p.created_at DESC
                `;
                break;
            case 'price_low_high':
                products = await sql`
                    SELECT p.*, u.name as user_name, u.email as user_email, u.username as user_username, u.profile_pic as user_profile_pic
                    FROM products p
                    LEFT JOIN users u ON p.user_id = u.id
                    WHERE p.category=${category} AND p.is_sold = false
                    ORDER BY p.price ASC
                `;
                break;
            case 'price_high_low':
                products = await sql`
                    SELECT p.*, u.name as user_name, u.email as user_email, u.username as user_username, u.profile_pic as user_profile_pic
                    FROM products p
                    LEFT JOIN users u ON p.user_id = u.id
                    WHERE p.category=${category} AND p.is_sold = false
                    ORDER BY p.price DESC
                `;
                break;
            case 'best_match':
            default:
                // For category pages, "best match" means newest with some randomization
                products = await sql`
                    SELECT p.*, u.name as user_name, u.email as user_email, u.username as user_username, u.profile_pic as user_profile_pic
                    FROM products p
                    LEFT JOIN users u ON p.user_id = u.id
                    WHERE p.category=${category} AND p.is_sold = false
                    ORDER BY (EXTRACT(EPOCH FROM p.created_at) * RANDOM()) DESC
                `;
                break;
        }
        
        res.status(200).json({success: true, data: products});
    } catch (error) {
        res.status(500).json({success: false, message: "Failed to fetch products by category"});
    }
};

export const deleteProductImage = async (req, res) => {
    const { id } = req.params;
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
        return res.status(400).json({
            success: false,
            message: "Image URL is required"
        });
    }
    
    try {
        // First verify the product exists and belongs to this user
        const existingProduct = await sql`
            SELECT * FROM products WHERE id=${id}
        `;
        
        if (existingProduct.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        
        // Check if the user is the owner of the product
        if (existingProduct[0].user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this product"
            });
        }
        
        // Check if product has more than one image
        if (!existingProduct[0].images || existingProduct[0].images.length <= 1) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete the only image of a product"
            });
        }
        
        // Remove the image from the images array
        const updatedImages = existingProduct[0].images.filter(img => img !== imageUrl);
        
        // Update the product with the new images array
        await sql`
            UPDATE products 
            SET images=${updatedImages}
            WHERE id=${id}
        `;
        
        // Delete the image from S3
        const key = getS3KeyFromUrl(imageUrl);
        if (key) {
            await deleteFileFromS3(key);
        }
        
        res.status(200).json({
            success: true,
            message: "Image deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete product image"
        });
    }
};

export const getSellerOtherProducts = async (req, res) => {
    const { userId, excludeProductId } = req.params;
    
    try {
        const products = await sql`
            SELECT p.*, u.name as user_name, u.email as user_email, u.profile_pic as user_profile_pic
            FROM products p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.user_id = ${userId} AND p.id != ${excludeProductId} AND p.is_sold = false
            ORDER BY p.created_at DESC
            LIMIT 10
        `;
        
        res.status(200).json({success: true, data: products});
    } catch (error) {
        res.status(500).json({success: false, message: "Failed to fetch seller's other products"});
    }
};

export const markProductAsSold = async (req, res) => {
    const { id } = req.params;
    
    try {
        // First verify the product exists and belongs to this user
        const existingProduct = await sql`
            SELECT * FROM products WHERE id=${id}
        `;
        
        if (existingProduct.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        
        // Check if the user is the owner of the product
        if (existingProduct[0].user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this product"
            });
        }
        
        // Check if product is already sold
        if (existingProduct[0].is_sold) {
            return res.status(400).json({
                success: false,
                message: "Product is already marked as sold"
            });
        }
        
        // Mark product as sold
        const updatedProduct = await sql`
            UPDATE products 
            SET is_sold = true 
            WHERE id=${id}
            RETURNING *
        `;
        
        res.status(200).json({
            success: true,
            message: "Product marked as sold successfully",
            data: updatedProduct[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to mark product as sold"
        });
    }
};

export const markProductAsAvailable = async (req, res) => {
    const { id } = req.params;
    
    try {
        // First verify the product exists and belongs to this user
        const existingProduct = await sql`
            SELECT * FROM products WHERE id=${id}
        `;
        
        if (existingProduct.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        
        // Check if the user is the owner of the product
        if (existingProduct[0].user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this product"
            });
        }
        
        // Check if product is already available
        if (!existingProduct[0].is_sold) {
            return res.status(400).json({
                success: false,
                message: "Product is already marked as available"
            });
        }
        
        // Mark product as available
        const updatedProduct = await sql`
            UPDATE products 
            SET is_sold = false 
            WHERE id=${id}
            RETURNING *
        `;
        
        res.status(200).json({
            success: true,
            message: "Product marked as available successfully",
            data: updatedProduct[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to mark product as available"
        });
    }
};

export const recordView = async (req, res) => {
  const { slug } = req.params;
  const userId = req.user?.id;                 // may be undefined
  const ipHash = req.ip ? crypto.createHash("sha256").update(req.ip).digest("hex") : null;
  
  // First get the product ID and owner ID from the slug
  let productId, productOwnerId;
  try {
    const product = await sql`SELECT id, user_id FROM products WHERE slug = ${slug}`;
    if (product.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    productId = product[0].id;
    productOwnerId = product[0].user_id;
  } catch (error) {
    return res.status(500).json({ error: "Failed to find product" });
  }

  // Don't record views if the user is viewing their own product
  if (userId && userId === productOwnerId) {
    return res.sendStatus(204);
  }

  try {
    await sql`
      INSERT INTO product_views (product_id, user_id, ip_hash)
      VALUES (${productId}, ${userId}, ${ipHash})
    `;

    // keep the existing "recently-seen" UX for logged-in users
    if (userId) await recordProductView(userId, productId);

    return res.sendStatus(204);
  } catch (e) {
    return res.status(500).json({ error: "failed to record view" });
  }
};

export const getHotProducts = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const hotProducts = await sql`
      SELECT
        p.*,
        COALESCE(COUNT(pv.id), 0) AS views_7d
      FROM products p
      LEFT JOIN product_views pv
        ON pv.product_id = p.id
        AND pv.viewed_at > NOW() - INTERVAL '7 days'
      WHERE p.is_sold = FALSE
      GROUP BY p.id
      ORDER BY views_7d DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return res.status(200).json({ success: true, data: hotProducts });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch hot products" });
  }
};

export const getRecentProducts = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        const recentProducts = await sql`
            SELECT p.*, u.name as user_name, u.email as user_email, u.profile_pic as user_profile_pic
            FROM products p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.is_sold = false
            ORDER BY p.created_at DESC
            LIMIT ${limit}
        `;
        
        res.status(200).json({success: true, data: recentProducts});
    } catch (error) {
        res.status(500).json({success: false, message: "Failed to fetch recent products"});
    }
};

export const getProductsByLocation = async (req, res) => {
    try {
        const { category, maxDistance = 10, sort = 'distance' } = req.query;
        const currentUserId = req.user?.id;
        
        if (!currentUserId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required for location-based filtering"
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
        
        // Base query to get products with user location data
        let baseQuery = sql`
            SELECT p.*, 
                   u.name as user_name, u.email as user_email, u.username as user_username, u.profile_pic as user_profile_pic,
                   u.location_type, u.campus_location_name, u.custom_latitude, u.custom_longitude
            FROM products p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.is_sold = false
        `;
        
        // Add category filter if specified
        let products;
        if (category) {
            products = await sql`
                SELECT p.*, 
                       u.name as user_name, u.email as user_email, u.username as user_username, u.profile_pic as user_profile_pic,
                       u.location_type, u.campus_location_name, u.custom_latitude, u.custom_longitude
                FROM products p
                LEFT JOIN users u ON p.user_id = u.id
                WHERE p.is_sold = false AND p.category = ${category}
            `;
        } else {
            products = await sql`
                SELECT p.*, 
                       u.name as user_name, u.email as user_email, u.username as user_username, u.profile_pic as user_profile_pic,
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
        
        // Sort products based on sort parameter
        switch (sort) {
            case 'distance':
                productsWithDistance.sort((a, b) => a.distance - b.distance);
                break;
            case 'recent_first':
                productsWithDistance.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'price_low_high':
                productsWithDistance.sort((a, b) => a.price - b.price);
                break;
            case 'price_high_low':
                productsWithDistance.sort((a, b) => b.price - a.price);
                break;
            default:
                // Default to distance
                productsWithDistance.sort((a, b) => a.distance - b.distance);
        }
        
        res.status(200).json({
            success: true, 
            data: productsWithDistance,
            userLocation: {
                latitude: userCoordinates.latitude,
                longitude: userCoordinates.longitude
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false, 
            message: "Failed to fetch products by location"
        });
    }
};

