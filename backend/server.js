import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import cookieParser from "cookie-parser";

import { app, server } from "./socket/socket.js";

import productRoutes from "./routes/productRoutes.js";
import { sql } from "./config/db.js";
import { aj } from "./lib/arcjet.js";
import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import savedProductRoutes from "./routes/savedProductRoutes.js";
import recentlySeenRoutes from "./routes/recentlySeenRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import { initializeMeiliSearch } from "./config/meilisearch.js";
import { syncExistingProducts } from "./utils/syncMeilisearch.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();

// Environment validation (soft). Only warn to allow container to boot for debugging.
const requiredEnvVars = ['JWT_SECRET', 'PGHOST', 'PGDATABASE', 'PGUSER', 'PGPASSWORD'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.warn('⚠️ Missing environment variables:', missingEnvVars.join(', '));
}

// Global error handlers (soft). Log but do not exit so ECS Exec remains possible.
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Do not exit; keep container alive for debugging
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection at:', promise, 'reason:', reason);
  // Do not exit; keep container alive for debugging
});

app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser());
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
); 
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')); 

app.use(async (req, res, next) => {
  // Allow health checks and disable Arcjet when no key is provided
  if (req.path === '/health' || !process.env.ARCJET_KEY) return next();
  try {
    const decision = await aj.protect(req, { requested: 1 });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return res.status(429).json({ error: "Too Many Requests" });
      }
      if (decision.reason.isBot()) {
        return res.status(403).json({ error: "Bot access denied" });
      }
      return res.status(403).json({ error: "Forbidden" });
    }

    if (decision.results.some((result) => result.reason.isBot() && result.reason.isSpoofed())) {
      return res.status(403).json({ error: "Spoofed bot detected" });
    }

    return next();
  } catch (error) {
    return next();
  }
});

// Health check endpoint for Docker
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/saved-products", savedProductRoutes);
app.use("/api/recently-seen", recentlySeenRoutes);
app.use("/api/users", userRoutes);
app.use("/api/search", searchRoutes);

// Test database connection (non-fatal)
async function testDBConnection() {
  try {
    await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

async function initDB() {
  // Test database connection first; skip init when not available
  const dbOk = await testDBConnection();
  if (!dbOk) {
    console.warn('⚠️ Skipping DB initialization because the database is unavailable.');
    return;
  }
  
  // Initialize products
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        images TEXT[] NOT NULL DEFAULT '{}',
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(255) NOT NULL,
        description TEXT,
        user_id INTEGER REFERENCES users(id),
        is_sold BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles')
      )
    `;


  } catch (error) {
    console.error('❌ Error initializing products table:', error);
  }
  
  // Add is_sold column to existing products table (migration)
  try {
    await sql`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS is_sold BOOLEAN DEFAULT FALSE
    `;

  } catch (error) {
    console.error('❌ Error applying products table migration:', error);
  }
  // Initialize users
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        profile_pic TEXT,
        description TEXT,
        year VARCHAR(50),
        major VARCHAR(255),
        isOnboarded BOOLEAN DEFAULT FALSE,
        lastLogin TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles'),
        isVerified BOOLEAN DEFAULT FALSE,
        resetPasswordToken VARCHAR(255),
        resetPasswordExpiresAt TIMESTAMPTZ,
        verificationToken VARCHAR(255),
        verificationTokenExpiresAt TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles'),
        googleId VARCHAR(255)
      )
    `;


  } catch (error) {
    console.error('❌ Error initializing users table:', error);
  }
  // Initialize chats
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY,
        user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles'),
        updated_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles'),
        last_message_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles'),
        UNIQUE(user1_id, user2_id, product_id)
      )
    `;


  } catch (error) {
    console.error('❌ Error initializing chats table:', error);
  }

  // Initialize messages
  try {
    await sql`
          CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
            sender_id INTEGER NOT NULL REFERENCES users(id),
            text TEXT,
            image TEXT,
            seen_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles'),
            updated_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles')
          )
        `;


  } catch (error) {
    console.error('❌ Error initializing messages table:', error);
  }
  
  // Initialize recently seen products
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS recently_seen_products (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        viewed_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles'),
        UNIQUE(user_id, product_id)
      )
    `;


  } catch (error) {
    console.error('❌ Error initializing recently seen products table:', error);
  }



  // Add location fields to users table (migration)
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS location_type VARCHAR(20) CHECK (location_type IN ('on_campus', 'off_campus'))`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS show_location_in_profile BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS campus_location_name VARCHAR(255)`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_address TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_latitude TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_longitude TEXT`;

    // Set default location to UCR Main Campus for existing users who don't have location set
    await sql`
      UPDATE users 
      SET location_type = 'on_campus', 
          campus_location_name = 'UCR Main Campus (default)'
      WHERE location_type IS NULL
    `;


  } catch (error) {
    console.error('❌ Error applying users table location fields migration:', error);
  }

  // Add username field to users table (migration)
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`;


  } catch (error) {
    console.error('❌ Error applying users table username field migration:', error);
  }

  // Add performance indexes (migration)
  try {
    // Core product indexes for better query performance
    await sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_sold ON products(category, is_sold)`;
    await sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_user_id_sold ON products(user_id, is_sold)`;
    await sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_created_at ON products(created_at)`;
    await sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_slug ON products(slug)`;
    
    // Message performance indexes
    await sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_chat_id_created ON messages(chat_id, created_at)`;
    await sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender_seen ON messages(sender_id, seen_at)`;
    await sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chats_users ON chats(user1_id, user2_id)`;
    
    // User-related indexes
    await sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recently_seen_user_viewed ON recently_seen_products(user_id, viewed_at)`;

    console.log('✅ Performance indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating performance indexes:', error);
  }
}

// Always start server regardless of DB/MeiliSearch status
(async () => {
  try {
    await initDB();
  } catch (e) {
    console.warn('⚠️ initDB encountered an error; continuing startup.', e);
  }
  try {
    // Initialize MeiliSearch
    await initializeMeiliSearch();
    
    // Optionally sync existing products on startup
    if (process.env.SYNC_MEILISEARCH_ON_STARTUP === 'true') {
      console.log('🔄 Syncing existing products to MeiliSearch...');
      await syncExistingProducts();
    }
  } catch (error) {
    console.error('❌ MeiliSearch initialization error:', error);
    // Continue server startup even if MeiliSearch fails
  }
  
  server.listen(PORT, () => {
    console.log(`🚀 Server started on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3001'}`);
  });
})();

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`📡 Received ${signal}. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      console.error('❌ Error during server shutdown:', err);
      process.exit(1);
    }
    
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
  
  // Force close server after 30 seconds
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
