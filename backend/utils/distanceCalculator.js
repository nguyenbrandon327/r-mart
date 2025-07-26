// Utility functions for calculating distances between coordinates
import { decryptLocationData } from "./crypto.js";

// Haversine formula to calculate distance between two points on Earth
// Returns distance in miles
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

// Get coordinates for a campus location by name
export const getCampusLocationCoordinates = (campusLocationName) => {
  const campusLocations = {
    'Aberdeen-Inverness': { latitude: 33.97841009690865, longitude: -117.3255630908025 },
    'Dundee': { latitude: 33.97875834795599, longitude: -117.32441248941895 },
    'Lothian': { latitude: 33.975949027902736, longitude: -117.32251305060348 },
    'Pentland Hills': { latitude: 33.977881727614516, longitude: -117.32240306677893 },
    'Bannockburn Village': { latitude: 33.97762364159829, longitude: -117.33147234167862 },
    'Falkirk': { latitude: 33.98043908008703, longitude: -117.3317568376434 },
    'Glen Mor': { latitude: 33.976621816198524, longitude: -117.32051349429331 },
    'North District': { latitude: 33.98005932637361, longitude: -117.32682120371766 },
    'North District 2': { latitude: 33.980012563393096, longitude: -117.33002713103215 },
    'Stonehaven': { latitude: 33.984025285454614, longitude: -117.33190955166202 },
    'The Plaza': { latitude: 33.978572024098504, longitude: -117.33373378424167 },
    'Oban Family Housing': { latitude: 33.97878868463515, longitude: -117.33218431443102 },
    'UCR Main Campus (default)': { latitude: 33.97397723944315, longitude: -117.32815785779336 }
  };
  
  return campusLocations[campusLocationName] || null;
};

// Get user's coordinates based on their location type
export const getUserCoordinates = (user) => {
  if (!user) return null;
  
  if (user.location_type === 'off_campus' && user.custom_latitude && user.custom_longitude) {
    try {
      // Decrypt the coordinates if they're encrypted
      const decryptedLocation = decryptLocationData({
        custom_latitude: user.custom_latitude,
        custom_longitude: user.custom_longitude
      });
      
      if (decryptedLocation.custom_latitude && decryptedLocation.custom_longitude) {
        return {
          latitude: decryptedLocation.custom_latitude,
          longitude: decryptedLocation.custom_longitude
        };
      }
    } catch (decryptError) {
      console.error("Error decrypting user coordinates:", decryptError);
      return null;
    }
  } else if (user.location_type === 'on_campus' && user.campus_location_name) {
    return getCampusLocationCoordinates(user.campus_location_name);
  }
  
  return null;
}; 