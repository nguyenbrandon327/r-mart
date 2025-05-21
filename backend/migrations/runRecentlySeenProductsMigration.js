import { runMigration } from "./recentlySeenProductsMigration.js";

// This file is for running the migration directly
// Example: node migrations/runRecentlySeenProductsMigration.js
runMigration()
  .then(() => {
    console.log("Migration execution complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration execution failed:", error);
    process.exit(1);
  }); 