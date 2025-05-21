import { sql } from "../config/db.js";
import { fileURLToPath } from 'url';

export const createSavedProductsTable = async () => {
  try {
    console.log("Creating saved_products table...");
    
    // Check if the table already exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'saved_products'
      );
    `;
    
    if (tableExists[0].exists) {
      console.log("saved_products table already exists.");
      return;
    }
    
    // Create the saved_products table
    await sql`
      CREATE TABLE saved_products (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      );
    `;
    
    console.log("saved_products table created successfully.");
  } catch (error) {
    console.error("Error creating saved_products table:", error);
    throw error;
  }
};

export const runMigration = async () => {
  try {
    await createSavedProductsTable();
    console.log("Saved products migration completed successfully");
  } catch (error) {
    console.error("Saved products migration failed:", error);
  }
};

// Run the migration if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigration();
} 