import { sql } from "../config/db.js";
import { deleteFileFromS3, getS3KeyFromUrl } from "../utils/s3.js";
import { recordProductView } from "./recentlySeenController.js";

// CRUD operations
export const getProducts = async (req, res) => {
    try {
        const products = await sql`
            SELECT p.*, u.name as user_name, u.email as user_email, u.profile_pic as user_profile_pic
            FROM products p
            LEFT JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
        `;
        console.log("fetched products");
        res.status(200).json({success:true, data:products});
    } catch (error) {
        console.log("Error in getProducts", error);
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
        const newProduct = await sql`
            INSERT INTO products (name, price, description, images, category, user_id)  
            VALUES (${name}, ${price}, ${description}, ${images}, ${category}, ${req.user.id})
            RETURNING *
        `;

        console.log("Product created successfully", newProduct);

        res.status(201).json({ success:true, data: newProduct[0] });
    } catch (error) {
        console.log("Error in createProduct", error);
        res.status(500).json({success: false, message: "Failed to create product"});
    }
};

export const getProduct = async (req, res) => {
    const { id } = req.params;

    try {
        const product = await sql `
            SELECT p.*, u.name as user_name, u.email as user_email, u.profile_pic as user_profile_pic
            FROM products p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.id=${id}
        `
        
        // Only record views for authenticated users
        // req.user will only exist if the user is logged in via protectRoute middleware
        console.log("Authentication status:", req.user ? `Authenticated as ${req.user.name} (ID: ${req.user.id})` : "Not authenticated");
        
        if (req.user && req.user.id) {
            console.log(`Recording product view: user=${req.user.id}, product=${id}`);
            await recordProductView(req.user.id, id);
        } else {
            console.log("Skipping product view recording - user not authenticated");
        }
        
        res.status(200).json({ success:true, data:product[0] });
    } catch (error) {
        console.log("Error in getProduct", error);
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

      const updateProduct = await sql`
        UPDATE products
        SET name=${name}, price=${price}, description=${description}, images=${finalImages}, category=${category}
        WHERE id=${id}
        RETURNING *
      `;
  
      res.status(200).json({ success: true, data: updateProduct[0] });
    } catch (error) {
      console.log("Error in updateProduct function", error);
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
  
      res.status(200).json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error) {
      console.log("Error in deleteProduct function", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const getProductsByCategory = async (req, res) => {
    const { category } = req.params;
    
    try {
        const products = await sql`
            SELECT p.*, u.name as user_name, u.email as user_email, u.profile_pic as user_profile_pic
            FROM products p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.category=${category}
            ORDER BY p.created_at DESC
        `;
        
        res.status(200).json({success: true, data: products});
    } catch (error) {
        console.log("Error in getProductsByCategory", error);
        res.status(500).json({success: false, message: "Failed to fetch products by category"});
    }
};

// Handle image deletion for a product
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
        console.log("Error in deleteProductImage", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete product image"
        });
    }
};

