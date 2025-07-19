import { sql } from "../config/db.js";
import { deleteFileFromS3, getS3KeyFromUrl } from "../utils/s3.js";

// Get current user's profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [user] = await sql`
      SELECT id, name, email, profile_pic, description, year, major, created_at, isVerified
      FROM users 
      WHERE id = ${userId}
    `;
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error("Error getting user profile:", error);
    res.status(500).json({
      success: false,
      message: "Error getting user profile",
      error: error.message
    });
  }
};

// Get user by username and their products
export const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    
    // Find user by email pattern (username@domain)
    const users = await sql`
      SELECT id, name, email, profile_pic, description, year, major, created_at
      FROM users 
      WHERE email LIKE ${username + '@%'}
      LIMIT 1
    `;
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    const user = users[0];
    
    // Get user's products (unsold first, then sold)
    const products = await sql`
      SELECT id, name, images, price, category, description, is_sold, created_at
      FROM products 
      WHERE user_id = ${user.id}
      ORDER BY is_sold ASC, created_at DESC
    `;
    
    res.status(200).json({
      success: true,
      user,
      products
    });
  } catch (error) {
    console.error("Error getting user by username:", error);
    res.status(500).json({
      success: false,
      message: "Error getting user",
      error: error.message
    });
  }
};

// Update user profile (name and description)
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description } = req.body;
    
    // Validate input
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Name is required"
      });
    }
    
    // Update user profile
    const [updatedUser] = await sql`
      UPDATE users 
      SET 
        name = ${name.trim()},
        description = ${description ? description.trim() : null}
      WHERE id = ${userId}
      RETURNING id, name, email, profile_pic, description, created_at, isVerified
    `;
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message
    });
  }
};

// Upload profile picture
export const uploadProfilePic = async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }
    
    // Get the current user's profile pic to delete the old one
    const [currentUser] = await sql`
      SELECT profile_pic FROM users WHERE id = ${userId}
    `;
    
    // Delete old profile pic from S3 if it exists
    if (currentUser && currentUser.profile_pic) {
      const oldKey = getS3KeyFromUrl(currentUser.profile_pic);
      if (oldKey) {
        await deleteFileFromS3(oldKey);
      }
    }
    
    // Update user with new profile pic URL
    const profilePicUrl = req.file.location;
    
    const [updatedUser] = await sql`
      UPDATE users 
      SET profile_pic = ${profilePicUrl}
      WHERE id = ${userId}
      RETURNING id, name, email, profile_pic, description, created_at, isVerified
    `;
    
    res.status(200).json({
      success: true,
      message: "Profile picture uploaded successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading profile picture",
      error: error.message
    });
  }
};

// Delete profile picture
export const deleteProfilePic = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get the current user's profile pic
    const [currentUser] = await sql`
      SELECT profile_pic FROM users WHERE id = ${userId}
    `;
    
    if (!currentUser || !currentUser.profile_pic) {
      return res.status(400).json({
        success: false,
        message: "No profile picture to delete"
      });
    }
    
    // Delete from S3
    const key = getS3KeyFromUrl(currentUser.profile_pic);
    if (key) {
      const deleted = await deleteFileFromS3(key);
      if (!deleted) {
        console.error("Failed to delete profile picture from S3");
      }
    }
    
    // Update user to remove profile pic
    const [updatedUser] = await sql`
      UPDATE users 
      SET profile_pic = NULL
      WHERE id = ${userId}
      RETURNING id, name, email, profile_pic, description, created_at, isVerified
    `;
    
    res.status(200).json({
      success: true,
      message: "Profile picture deleted successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error deleting profile picture:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting profile picture",
      error: error.message
    });
  }
};

// Update user onboarding step 1 (year and major)
export const updateOnboardingStep1 = async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, major } = req.body;
    
    // Validate input
    const validYears = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Grad Student'];
    if (!year || !validYears.includes(year)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid year"
      });
    }
    
    if (!major || major.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Major is required"
      });
    }
    
    // Update user with year and major
    const [updatedUser] = await sql`
      UPDATE users 
      SET 
        year = ${year},
        major = ${major.trim()}
      WHERE id = ${userId}
      RETURNING id, name, email, year, major, profile_pic, description, isOnboarded
    `;
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Onboarding step 1 completed",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating onboarding step 1:", error);
    res.status(500).json({
      success: false,
      message: "Error updating onboarding information",
      error: error.message
    });
  }
};

// Complete onboarding (after profile pic and description are set)
export const completeOnboarding = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user has completed all required fields
    const [user] = await sql`
      SELECT year, major FROM users WHERE id = ${userId}
    `;
    
    if (!user || !user.year || !user.major) {
      return res.status(400).json({
        success: false,
        message: "Please complete all onboarding steps"
      });
    }
    
    // Mark onboarding as complete
    const [updatedUser] = await sql`
      UPDATE users 
      SET isOnboarded = true
      WHERE id = ${userId}
      RETURNING id, name, email, profile_pic, description, year, major, isOnboarded, created_at, isVerified
    `;
    
    res.status(200).json({
      success: true,
      message: "Onboarding completed successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    res.status(500).json({
      success: false,
      message: "Error completing onboarding",
      error: error.message
    });
  }
};

// Complete all onboarding in one step
export const completeOnboardingAll = async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, major } = req.body;
    
    // Validate required fields
    const validYears = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Grad Student'];
    if (!year || !validYears.includes(year)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid year"
      });
    }
    
    if (!major || major.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Major is required"
      });
    }
    
    // Update user with year, major and mark as onboarded
    const [updatedUser] = await sql`
      UPDATE users 
      SET 
        year = ${year},
        major = ${major.trim()},
        isOnboarded = true
      WHERE id = ${userId}
      RETURNING id, name, email, profile_pic, description, year, major, isOnboarded, created_at, isVerified
    `;
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Onboarding completed successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    res.status(500).json({
      success: false,
      message: "Error completing onboarding",
      error: error.message
    });
  }
}; 