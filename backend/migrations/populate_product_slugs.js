import { populateExistingSlugs } from '../utils/slugUtils.js';

/**
 * Migration script to populate slugs for existing products
 * Run this after adding the slug column to the products table
 */
async function runMigration() {
  try {
    console.log('Running product slug population migration...');
    await populateExistingSlugs();
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  runMigration();
}

export { runMigration };