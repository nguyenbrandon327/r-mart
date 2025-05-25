import { sql } from "../config/db.js";

async function addUserProfileFields() {
  try {
    // Check if columns already exist
    const checkColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('profile_pic', 'description')
    `;
    
    const existingColumns = checkColumns.map(row => row.column_name);
    
    // Add profile_pic column if it doesn't exist
    if (!existingColumns.includes('profile_pic')) {
      await sql`
        ALTER TABLE users 
        ADD COLUMN profile_pic TEXT
      `;
      console.log("Added profile_pic column to users table");
    } else {
      console.log("profile_pic column already exists");
    }
    
    // Add description column if it doesn't exist
    if (!existingColumns.includes('description')) {
      await sql`
        ALTER TABLE users 
        ADD COLUMN description TEXT
      `;
      console.log("Added description column to users table");
    } else {
      console.log("description column already exists");
    }
    
    console.log("Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

addUserProfileFields(); 