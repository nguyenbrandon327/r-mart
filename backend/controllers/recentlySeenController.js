import { sql } from "../config/db.js";

// Record that a product was viewed by a user
export const recordProductView = async (userId, productId) => {
  if (!userId || !productId) {
    return false;
  }

  try {
    // Check if the user is the owner of the product
    const product = await sql`
      SELECT user_id FROM products WHERE id = ${productId}
    `;
    
    if (product.length === 0) {
      return false;
    }
    
    if (product[0].user_id === userId) {
      return false;
    }

    // Try to update the view timestamp if the record already exists
    const updateResult = await sql`
      UPDATE recently_seen_products
      SET viewed_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId} AND product_id = ${productId}
      RETURNING *
    `;



    // If no existing record was found, insert a new one
    if (updateResult.length === 0) {
      const insertResult = await sql`
        INSERT INTO recently_seen_products (user_id, product_id)
        VALUES (${userId}, ${productId})
        ON CONFLICT (user_id, product_id) DO UPDATE
        SET viewed_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

    }

    return true;
  } catch (error) {
    return false;
  }
};

// Get recently viewed products for a user
export const getRecentlyViewedProducts = async (req, res) => {
  const userId = req.user.id;
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;

  try {
    const recentlyViewedProducts = await sql`
      SELECT p.*, r.viewed_at, u.name as user_name, u.email as user_email
      FROM recently_seen_products r
      JOIN products p ON r.product_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE r.user_id = ${userId} AND p.user_id != ${userId}
      ORDER BY r.viewed_at DESC
      LIMIT ${limit}
    `;

    res.status(200).json({
      success: true,
      data: recentlyViewedProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch recently viewed products"
    });
  }
};

// Clear all recently viewed products for a user
export const clearRecentlyViewedProducts = async (req, res) => {
  const userId = req.user.id;

  try {
    await sql`
      DELETE FROM recently_seen_products 
      WHERE user_id = ${userId}
    `;

    res.status(200).json({
      success: true,
      message: "Recently viewed products cleared successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to clear recently viewed products"
    });
  }
}; 