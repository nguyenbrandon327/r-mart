import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;

const dbEnvVarsPresent = Boolean(PGHOST && PGDATABASE && PGUSER && PGPASSWORD);

// creates a SQL connection when DB env vars are available; otherwise exports a safe fallback
let sql;

if (dbEnvVarsPresent) {
  sql = neon(
    `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?sslmode=require`
  );
} else {
  console.warn(
    "⚠️ Database environment variables are missing. DB operations will fail until configured."
  );
  // Provide a safe, tagged-template-compatible fallback that rejects when used
  sql = async function sqlFallback() {
    throw new Error(
      "Database is not configured. Ensure PGHOST, PGDATABASE, PGUSER, and PGPASSWORD are set."
    );
  };
}

export { sql };
export default sql;
