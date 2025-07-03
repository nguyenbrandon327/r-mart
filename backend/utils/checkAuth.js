import jwt from "jsonwebtoken";
import { sql } from "../config/db.js";

// This middleware checks if a user is authenticated, but allows the request
// to continue even if they are not. This is useful for routes that should
// work for both authenticated and non-authenticated users.
export const checkAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      // No token, but still continue (just without user data)
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from the token
    const user = await sql`SELECT id, name, email, isOnboarded FROM users WHERE id=${decoded.userId}`;
    
    if (user && user.length > 0) {
      // Add user to request object
      req.user = user[0];
    }
    
    next();
  } catch (error) {
    // Token is invalid or expired, but still continue (just without user data)
    console.error("Error in checkAuth middleware:", error);
    next();
  }
}; 