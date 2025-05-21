import { runMigration } from "./savedProductsMigration.js";

console.log("Running saved products migration...");
runMigration()
  .then(() => {
    console.log("Saved products migration completed");
    process.exit(0);
  })
  .catch(error => {
    console.error("Error running saved products migration:", error);
    process.exit(1);
  }); 