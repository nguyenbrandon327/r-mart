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
import { initializeElasticsearch } from "./config/elasticsearch.js";
import { syncExistingProducts } from "./utils/syncElasticsearch.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3001',
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
app.use(morgan("dev")); 

app.use(async (req, res, next) => {
  try {
    const decision = await aj.protect(req, {
      requested: 1, 
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        res.status(429).json({ error: "Too Many Requests" });
      } else if (decision.reason.isBot()) {
        res.status(403).json({ error: "Bot access denied" });
      } else {
        res.status(403).json({ error: "Forbidden" });
      }
      return;
    }

    if (decision.results.some((result) => result.reason.isBot() && result.reason.isSpoofed())) {
      res.status(403).json({ error: "Spoofed bot detected" });
      return;
    }

    next();
  } catch (error) {
    console.log("Arcjet error", error);
    next(error);
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

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

async function initDB() {
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log("Products table initialized successfully");
  } catch (error) {
    console.log("Error initializing products table", error);
  }
  
  // Add is_sold column to existing products table (migration)
  try {
    await sql`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS is_sold BOOLEAN DEFAULT FALSE
    `;
    console.log("Products table migration (is_sold column) applied successfully");
  } catch (error) {
    console.log("Error applying products table migration", error);
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
        lastLogin TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        isVerified BOOLEAN DEFAULT FALSE,
        resetPasswordToken VARCHAR(255),
        resetPasswordExpiresAt TIMESTAMP,
        verificationToken VARCHAR(255),
        verificationTokenExpiresAt TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        googleId VARCHAR(255)
      )
    `;

    console.log("Users table initialized successfully");
  } catch (error) {
    console.log("Error initializing users table", error);
  }
  // Initialize chats
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY,
        user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user1_id, user2_id, product_id)
      )
    `;

    console.log("Chats table initialized successfully");
  } catch (error) {
    console.log("Error initializing chats table", error);
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
            seen_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;

    console.log("Messages table initialized successfully");
  } catch (error) {
    console.log("Error initializing messages table", error);
  }
  
  // Initialize recently seen products
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS recently_seen_products (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      )
    `;

    console.log("Recently seen products table initialized successfully");
  } catch (error) {
    console.log("Error initializing recently seen products table", error);
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

    console.log("Users table location fields migration applied successfully");
  } catch (error) {
    console.log("Error applying users table location fields migration", error);
  }
}

initDB().then(async () => {
  try {
    // Initialize Elasticsearch
    await initializeElasticsearch();
    
    // Optionally sync existing products on startup
    if (process.env.SYNC_ELASTICSEARCH_ON_STARTUP === 'true') {
      console.log('Syncing existing products to Elasticsearch...');
      await syncExistingProducts();
    }
  } catch (error) {
    console.error('Elasticsearch initialization error:', error);
    // Continue server startup even if Elasticsearch fails
  }
  
  server.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
  });
});
