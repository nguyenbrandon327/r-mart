import { sql } from "../config/db.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function createMessagesTable() {
  try {
    console.log('Starting messages table creation...');
    
    // Check if the messages table already exists
    const tableResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'messages'
    `;
    
    if (tableResult.length === 0) {
      console.log('Creating messages table...');
      
      // Create messages table
      await sql`
        CREATE TABLE messages (
          id SERIAL PRIMARY KEY,
          sender_id INTEGER NOT NULL REFERENCES users(id),
          receiver_id INTEGER NOT NULL REFERENCES users(id),
          text TEXT,
          image TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      // Create index for faster message retrieval between users
      await sql`
        CREATE INDEX idx_messages_sender_receiver
        ON messages(sender_id, receiver_id)
      `;
      
      console.log('Messages table created successfully');
    } else {
      console.log('Messages table already exists');
    }
  } catch (error) {
    console.error('Error during messages table creation:', error);
  }
}

// Run the migration
createMessagesTable().then(() => {
  console.log('Message migration script finished');
  process.exit(0);
}); 