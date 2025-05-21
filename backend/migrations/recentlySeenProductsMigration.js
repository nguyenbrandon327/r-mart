import { sql } from "../config/db.js";
import { fileURLToPath } from 'url';

export const createRecentlySeenProductsTable = async () => {
  try {
    console.log("Creating recently_seen_products table...");
    
    // Check if the table already exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'recently_seen_products'
      );
    `;
    
    if (tableExists[0].exists) {
      console.log("recently_seen_products table already exists.");
      return;
    }
    
    // Create the recently_seen_products table
    await sql`
      CREATE TABLE recently_seen_products (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      );
    `;
    
    console.log("recently_seen_products table created successfully.");
  } catch (error) {
    console.error("Error creating recently_seen_products table:", error);
    throw error;
  }
};

export const runMigration = async () => {
  try {
    await createRecentlySeenProductsTable();
    console.log("Recently seen products migration completed successfully");
  } catch (error) {
    console.error("Recently seen products migration failed:", error);
  }
};

// Run the migration if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigration();
} 