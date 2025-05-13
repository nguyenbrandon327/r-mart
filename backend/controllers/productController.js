import { sql } from "../config/db.js";

// CRUD operations
export const getProducts = async (req, res) => {
    try {
        const products = await sql`
            SELECT p.*, u.name as user_name 
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
    const {name, price, description, image, category} = req.body

    if (!name || !price || !description || !image || !category) {
        return res.status(400).json({success:false, message: "All fields are required"});
    }

    try {
        const newProduct = await sql`
            INSERT INTO products (name, price, description, image, category, user_id)  
            VALUES (${name}, ${price}, ${description}, ${image}, ${category}, ${req.user.id})
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
            SELECT p.*, u.name as user_name 
            FROM products p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.id=${id}
        `
        res.status(200).json({ success:true, data:product[0] });
    } catch (error) {
        console.log("Error in getProduct", error);
        res.status(500).json({success: false, message: "Failed to fetch product"});
    }
};

export const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, price, description, image, category } = req.body;
  
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

      const updateProduct = await sql`
        UPDATE products
        SET name=${name}, price=${price}, description=${description}, image=${image}, category=${category}
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
        // First verify the product exists and get its current data
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
        if (existingProduct[0].user_id && existingProduct[0].user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to delete this product",
            });
        }

        const deletedProduct = await sql`
            DELETE FROM products WHERE id=${id}
            RETURNING *
        `;
        
        res.status(200).json({success:true, data: deletedProduct[0]});
    } catch (error) {
        console.log("Error in deleteProduct function", error);
        res.status(500).json({success: false, message: "Failed to delete product"});
    }
};

export const getProductsByCategory = async (req, res) => {
    const { category } = req.params;
    
    try {
        const products = await sql`
            SELECT p.*, u.name as user_name 
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

