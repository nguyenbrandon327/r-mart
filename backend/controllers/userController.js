import { sql } from "../config/db.js";
import { deleteFileFromS3, getS3KeyFromUrl } from "../utils/s3.js";
import { encryptLocationData, decryptLocationData } from "../utils/crypto.js";

// Get current user's profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [user] = await sql`
      SELECT u.id, u.name, u.email, u.username, u.profile_pic, u.description, u.year, u.major, u.created_at, u.isVerified,
             u.location_type, u.show_location_in_profile, u.campus_location_name, u.custom_address,
             u.custom_latitude, u.custom_longitude
      FROM users u
      WHERE u.id = ${userId}
    `;
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Decrypt location data before returning to client
    if (user.location_type === 'off_campus') {
      try {
        const decryptedLocation = decryptLocationData({
          custom_address: user.custom_address,
          custom_latitude: user.custom_latitude,
          custom_longitude: user.custom_longitude
        });
        
        user.custom_address = decryptedLocation.custom_address;
        user.custom_latitude = decryptedLocation.custom_latitude;
        user.custom_longitude = decryptedLocation.custom_longitude;
      } catch (decryptError) {
        console.error("Error decrypting location data:", decryptError);
        // Set to null if decryption fails to avoid exposing encrypted data
        user.custom_address = null;
        user.custom_latitude = null;
        user.custom_longitude = null;
      }
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
    
    // Find user by username
    const users = await sql`
      SELECT u.id, u.name, u.email, u.username, u.profile_pic, u.description, u.year, u.major, u.created_at,
             u.location_type, u.show_location_in_profile, u.campus_location_name, u.custom_address,
             u.custom_latitude, u.custom_longitude
      FROM users u
      WHERE u.username = ${username}
      LIMIT 1
    `;
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    const user = users[0];
    
    // Decrypt location data before returning to client (only if user wants to show location)
    if (user.location_type === 'off_campus' && user.show_location_in_profile) {
      try {
        const decryptedLocation = decryptLocationData({
          custom_address: user.custom_address,
          custom_latitude: user.custom_latitude,
          custom_longitude: user.custom_longitude
        });
        
        user.custom_address = decryptedLocation.custom_address;
        user.custom_latitude = decryptedLocation.custom_latitude;
        user.custom_longitude = decryptedLocation.custom_longitude;
      } catch (decryptError) {
        console.error("Error decrypting location data:", decryptError);
        // Set to null if decryption fails
        user.custom_address = null;
        user.custom_latitude = null;
        user.custom_longitude = null;
      }
    } else if (user.location_type === 'off_campus' && !user.show_location_in_profile) {
      // Hide location data if user doesn't want to show it
      user.custom_address = null;
      user.custom_latitude = null;
      user.custom_longitude = null;
    }
    
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
    const { name, description, major } = req.body;
    
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
        description = ${description ? description.trim() : null},
        major = ${major ? major.trim() : null}
      WHERE id = ${userId}
      RETURNING id, name, email, username, profile_pic, description, major, year, created_at, isVerified,
                location_type, show_location_in_profile, campus_location_name, custom_address,
                custom_latitude, custom_longitude
    `;
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Decrypt location data before returning to client
    if (updatedUser.location_type === 'off_campus') {
      try {
        const decryptedLocation = decryptLocationData({
          custom_address: updatedUser.custom_address,
          custom_latitude: updatedUser.custom_latitude,
          custom_longitude: updatedUser.custom_longitude
        });
        
        updatedUser.custom_address = decryptedLocation.custom_address;
        updatedUser.custom_latitude = decryptedLocation.custom_latitude;
        updatedUser.custom_longitude = decryptedLocation.custom_longitude;
      } catch (decryptError) {
        console.error("Error decrypting location data:", decryptError);
        // Set to null if decryption fails to avoid exposing encrypted data
        updatedUser.custom_address = null;
        updatedUser.custom_latitude = null;
        updatedUser.custom_longitude = null;
      }
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
      RETURNING id, name, email, username, profile_pic, description, year, major, created_at, isVerified,
                location_type, show_location_in_profile, campus_location_name, custom_address,
                custom_latitude, custom_longitude
    `;
    
    // Decrypt location data before returning to client
    if (updatedUser.location_type === 'off_campus') {
      try {
        const decryptedLocation = decryptLocationData({
          custom_address: updatedUser.custom_address,
          custom_latitude: updatedUser.custom_latitude,
          custom_longitude: updatedUser.custom_longitude
        });
        
        updatedUser.custom_address = decryptedLocation.custom_address;
        updatedUser.custom_latitude = decryptedLocation.custom_latitude;
        updatedUser.custom_longitude = decryptedLocation.custom_longitude;
      } catch (decryptError) {
        console.error("Error decrypting location data:", decryptError);
        // Set to null if decryption fails to avoid exposing encrypted data
        updatedUser.custom_address = null;
        updatedUser.custom_latitude = null;
        updatedUser.custom_longitude = null;
      }
    }
    
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
      RETURNING id, name, email, username, profile_pic, description, year, major, created_at, isVerified,
                location_type, show_location_in_profile, campus_location_name, custom_address,
                custom_latitude, custom_longitude
    `;
    
    // Decrypt location data before returning to client
    if (updatedUser.location_type === 'off_campus') {
      try {
        const decryptedLocation = decryptLocationData({
          custom_address: updatedUser.custom_address,
          custom_latitude: updatedUser.custom_latitude,
          custom_longitude: updatedUser.custom_longitude
        });
        
        updatedUser.custom_address = decryptedLocation.custom_address;
        updatedUser.custom_latitude = decryptedLocation.custom_latitude;
        updatedUser.custom_longitude = decryptedLocation.custom_longitude;
      } catch (decryptError) {
        console.error("Error decrypting location data:", decryptError);
        // Set to null if decryption fails to avoid exposing encrypted data
        updatedUser.custom_address = null;
        updatedUser.custom_latitude = null;
        updatedUser.custom_longitude = null;
      }
    }
    
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
      RETURNING id, name, email, username, year, major, profile_pic, description, isOnboarded
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
      RETURNING id, name, email, username, profile_pic, description, year, major, isOnboarded, created_at, isVerified
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
      RETURNING id, name, email, username, profile_pic, description, year, major, isOnboarded, created_at, isVerified
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



// Update user location during onboarding
export const updateUserLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      locationType, 
      campusLocationName, 
      customAddress, 
      customLatitude, 
      customLongitude, 
      showLocationInProfile 
    } = req.body;

    // Validate location type
    if (!locationType || !['on_campus', 'off_campus'].includes(locationType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid location type"
      });
    }

    // Validate campus location for on-campus users
    if (locationType === 'on_campus' && !campusLocationName) {
      return res.status(400).json({
        success: false,
        message: "Campus location name is required for on-campus users"
      });
    }

    // Validate custom address for off-campus users (only if they're not using don't share option)
    if (locationType === 'off_campus' && (!customAddress || !customLatitude || !customLongitude)) {
      return res.status(400).json({
        success: false,
        message: "Address and coordinates are required for off-campus users"
      });
    }

    // Encrypt location data for off-campus users before storing
    let encryptedLocationData = {
      custom_address: null,
      custom_latitude: null,
      custom_longitude: null
    };

    if (locationType === 'off_campus') {
      try {
        encryptedLocationData = encryptLocationData({
          custom_address: customAddress,
          custom_latitude: customLatitude,
          custom_longitude: customLongitude
        });
      } catch (encryptError) {
        console.error("Error encrypting location data:", encryptError);
        return res.status(500).json({
          success: false,
          message: "Error securing location data"
        });
      }
    }

    // Update user location
    await sql`
      UPDATE users 
      SET 
        location_type = ${locationType},
        show_location_in_profile = ${showLocationInProfile || false},
        campus_location_name = ${locationType === 'on_campus' ? campusLocationName : null},
        custom_address = ${encryptedLocationData.custom_address},
        custom_latitude = ${encryptedLocationData.custom_latitude},
        custom_longitude = ${encryptedLocationData.custom_longitude}
      WHERE id = ${userId}
    `;

    // Get the updated user
    const [updatedUser] = await sql`
      SELECT u.id, u.name, u.email, u.username, u.profile_pic, u.description, u.year, u.major, u.created_at, u.isVerified,
             u.location_type, u.show_location_in_profile, u.campus_location_name, u.custom_address,
             u.custom_latitude, u.custom_longitude, u.isOnboarded
      FROM users u
      WHERE u.id = ${userId}
    `;

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Decrypt location data before returning to client
    if (updatedUser.location_type === 'off_campus') {
      try {
        const decryptedLocation = decryptLocationData({
          custom_address: updatedUser.custom_address,
          custom_latitude: updatedUser.custom_latitude,
          custom_longitude: updatedUser.custom_longitude
        });
        
        updatedUser.custom_address = decryptedLocation.custom_address;
        updatedUser.custom_latitude = decryptedLocation.custom_latitude;
        updatedUser.custom_longitude = decryptedLocation.custom_longitude;
      } catch (decryptError) {
        console.error("Error decrypting location data for response:", decryptError);
        // Set to null if decryption fails
        updatedUser.custom_address = null;
        updatedUser.custom_latitude = null;
        updatedUser.custom_longitude = null;
      }
    }

    res.status(200).json({
      success: true,
      message: "Location updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user location:", error);
    res.status(500).json({
      success: false,
      message: "Error updating location",
      error: error.message
    });
  }
}; 

// Check username availability
export const checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: "Username is required"
      });
    }

    // Validate username format (alphanumeric and underscores only, 3-30 characters)
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username.trim())) {
      return res.status(400).json({
        success: false,
        message: "Username must be 3-30 characters long and contain only letters, numbers, and underscores"
      });
    }

    // Check if username already exists
    const [existingUser] = await sql`
      SELECT id FROM users WHERE username = ${username.trim().toLowerCase()}
    `;

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Username is already taken"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Username is available"
    });
  } catch (error) {
    console.error('Username availability check error:', error);
    return res.status(500).json({
      success: false,
      message: "Error checking username availability",
      error: error.message
    });
  }
};

// Update username during onboarding
export const updateUsername = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username } = req.body;
    
    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: "Username is required"
      });
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username.trim())) {
      return res.status(400).json({
        success: false,
        message: "Username must be 3-30 characters long and contain only letters, numbers, and underscores"
      });
    }

    // Check if username already exists (excluding current user)
    const [existingUser] = await sql`
      SELECT id FROM users WHERE username = ${username.trim().toLowerCase()} AND id != ${userId}
    `;

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Username is already taken"
      });
    }

    // Update username
    const [updatedUser] = await sql`
      UPDATE users 
      SET username = ${username.trim().toLowerCase()}
      WHERE id = ${userId}
      RETURNING id, name, email, username, profile_pic, description, year, major, isOnboarded, created_at, isVerified
    `;

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Username updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error('Username update error:', error);
    return res.status(500).json({
      success: false,
      message: "Error updating username",
      error: error.message
    });
  }
};

// Geocode address using Nominatim API
export const geocodeAddress = async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address || !address.trim()) {
      return res.status(400).json({
        success: false,
        message: "Address is required"
      });
    }

    // Make request to Nominatim with proper headers
    const encodedAddress = encodeURIComponent(address.trim());
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'R-Mart App (contact: your-email@example.com)', // Replace with your actual contact
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      return res.status(200).json({
        success: true,
        coordinates: {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        }
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "No coordinates found for this address"
      });
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    return res.status(500).json({
      success: false,
      message: "Error geocoding address",
      error: error.message
    });
  }
}; 