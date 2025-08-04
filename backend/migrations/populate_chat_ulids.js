import { populateExistingChatULIDs } from '../utils/ulidUtils.js';

/**
 * Migration script to populate ULIDs for existing chats
 * Run this after adding the ulid column to the chats table
 */
async function runMigration() {
  try {
    console.log('Running chat ULID population migration...');
    await populateExistingChatULIDs();
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration if this file is executed directly
// Use a more robust check that works on Windows
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('populate_chat_ulids.js')) {
  runMigration();
}

export { runMigration };