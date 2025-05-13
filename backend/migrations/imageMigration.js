import { sql } from "../config/db.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function migrateProductImages() {
  try {
    console.log('Starting image migration...');
    
    // Check if the images column exists
    const columnsResult = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'images'
    `;
    
    if (columnsResult.length === 0) {
      console.log('Adding images column to products table...');
      await sql`ALTER TABLE products ADD COLUMN images TEXT[] NOT NULL DEFAULT '{}'`;
    }
    
    // Get all products with image field
    const products = await sql`
      SELECT id, image 
      FROM products 
      WHERE image IS NOT NULL AND image != ''
    `;
    
    console.log(`Found ${products.length} products to migrate`);
    
    // Update each product
    for (const product of products) {
      if (product.image) {
        // Add the existing image to the images array
        await sql`
          UPDATE products 
          SET images = array_append(images, ${product.image}) 
          WHERE id = ${product.id}
        `;
      }
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

// Run the migration
migrateProductImages().then(() => {
  console.log('Image migration script finished');
  process.exit(0);
}); 