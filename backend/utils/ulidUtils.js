import { ulid } from 'ulid';
import { sql } from '../config/db.js';

/**
 * Generate a new ULID
 * @returns {string} - A new ULID string
 */
export function generateULID() {
  return ulid();
}

/**
 * Generate a unique ULID for a chat, handling the extremely unlikely case of duplicates
 * @returns {Promise<string>} - Unique ULID
 */
export async function generateUniqueChatULID() {
  let attempts = 0;
  const maxAttempts = 10; // ULIDs are extremely unlikely to collide, but just to be safe
  
  while (attempts < maxAttempts) {
    const chatULID = generateULID();
    
    try {
      // Check if ULID already exists
      const existingChat = await sql`
        SELECT id FROM chats 
        WHERE ulid = ${chatULID}
        LIMIT 1
      `;
      
      // If no existing chat found, this ULID is unique
      if (existingChat.length === 0) {
        return chatULID;
      }
      
      attempts++;
    } catch (error) {
      // On error, return the ULID anyway as collisions are extremely rare
      return chatULID;
    }
  }
  
  // Fallback: return a new ULID (collisions are astronomically unlikely)
  return generateULID();
}

/**
 * Populate existing chats with ULIDs
 * This function is used for migration purposes
 */
export async function populateExistingChatULIDs() {
  try {
    // Get all chats without ULIDs
    const chats = await sql`
      SELECT id FROM chats 
      WHERE ulid IS NULL OR ulid = ''
      ORDER BY id
    `;
    
    for (const chat of chats) {
      const chatULID = await generateUniqueChatULID();
      
      await sql`
        UPDATE chats 
        SET ulid = ${chatULID} 
        WHERE id = ${chat.id}
      `;
      

    }
    
    return true;
  } catch (error) {
    throw error;
  }
}