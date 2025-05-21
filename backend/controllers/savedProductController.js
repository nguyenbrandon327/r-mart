import { sql } from "../config/db.js";

// Save a product
export const saveProduct = async (req, res) => {
  const { productId } = req.body;
  const userId = req.user.id;

  if (!productId) {
    return res.status(400).json({ 
      success: false, 
      message: "Product ID is required" 
    });
  }

  try {
    // Check if the product exists
    const product = await sql`
      SELECT * FROM products WHERE id = ${productId}
    `;

    if (product.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Check if the product is already saved by the user
    const existingSavedProduct = await sql`
      SELECT * FROM saved_products 
      WHERE user_id = ${userId} AND product_id = ${productId}
    `;

    if (existingSavedProduct.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Product already saved"
      });
    }

    // Save the product
    const savedProduct = await sql`
      INSERT INTO saved_products (user_id, product_id)
      VALUES (${userId}, ${productId})
      RETURNING *
    `;

    res.status(201).json({
      success: true,
      message: "Product saved successfully",
      data: savedProduct[0]
    });
  } catch (error) {
    console.error("Error saving product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save product"
    });
  }
};

// Unsave/remove a product
export const unsaveProduct = async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;

  try {
    // Check if the product is saved by the user
    const savedProduct = await sql`
      SELECT * FROM saved_products 
      WHERE user_id = ${userId} AND product_id = ${productId}
    `;

    if (savedProduct.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Saved product not found"
      });
    }

    // Remove the saved product
    await sql`
      DELETE FROM saved_products 
      WHERE user_id = ${userId} AND product_id = ${productId}
    `;

    res.status(200).json({
      success: true,
      message: "Product removed from saved items"
    });
  } catch (error) {
    console.error("Error removing saved product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove saved product"
    });
  }
};

// Get all saved products for a user
export const getSavedProducts = async (req, res) => {
  const userId = req.user.id;

  try {
    const savedProducts = await sql`
      SELECT p.*, sp.created_at as saved_at
      FROM saved_products sp
      JOIN products p ON sp.product_id = p.id
      WHERE sp.user_id = ${userId}
      ORDER BY sp.created_at DESC
    `;

    res.status(200).json({
      success: true,
      data: savedProducts
    });
  } catch (error) {
    console.error("Error fetching saved products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch saved products"
    });
  }
};

// Check if a product is saved by the user
export const isProductSaved = async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;

  try {
    const savedProduct = await sql`
      SELECT * FROM saved_products 
      WHERE user_id = ${userId} AND product_id = ${productId}
    `;

    res.status(200).json({
      success: true,
      isSaved: savedProduct.length > 0
    });
  } catch (error) {
    console.error("Error checking if product is saved:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check if product is saved"
    });
  }
}; 