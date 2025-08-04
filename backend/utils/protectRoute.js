import jwt from "jsonwebtoken";
import { sql } from "../config/db.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized, no token" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from the token
    const user = await sql`SELECT id, name, email, username, profile_pic, description, isVerified, isOnboarded FROM users WHERE id=${decoded.userId}`;
    
    if (!user || user.length === 0) {
      return res.status(401).json({ success: false, message: "Not authorized, user not found" });
    }
    
    // Add user to request object
    req.user = user[0];
    next();
  } catch (error) {
    console.error("Error in protectRoute middleware:", error);
    res.status(401).json({ success: false, message: "Not authorized, token failed" });
  }
}; 