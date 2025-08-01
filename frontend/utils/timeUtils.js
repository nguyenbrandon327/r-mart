/**
 * Format timestamp as relative time (e.g., "Just now", "5 minutes ago", "2 hours ago")
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} Formatted relative time string
 */
export const formatRelativeTime = (timestamp) => {
  const now = new Date();
  let date = new Date(timestamp);
  
  // Handle database timezone issue: Our database stores Pacific time but serializes it as UTC
  // We need to adjust for this when the timestamp is from our database
  // Check if this looks like a database timestamp (ends with Z or +00:00)
  const timestampStr = timestamp.toString();
  if (timestampStr.endsWith('Z') || timestampStr.includes('+00')) {
    // Get the current Pacific timezone offset
    const pacificDate = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
    const utcDate = new Date().toLocaleString("en-US", { timeZone: "UTC" });
    const offsetMs = new Date(utcDate).getTime() - new Date(pacificDate).getTime();
    
    // Adjust the timestamp by the Pacific offset
    date = new Date(date.getTime() + offsetMs);
  }
  
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  // Handle future dates (shouldn't happen, but just in case)
  if (diffInSeconds < 0) {
    return 'Just now';
  }
  
  // Less than 30 seconds
  if (diffInSeconds < 30) {
    return 'Just now';
  }
  
  // Less than 60 seconds
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  
  // Less than 60 minutes
  if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  
  // Less than 24 hours
  if (diffInHours < 24) {
    return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  
  // Less than 7 days
  if (diffInDays < 7) {
    return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  
  // Less than 4 weeks
  if (diffInWeeks < 4) {
    return diffInWeeks === 1 ? '1 week ago' : `${diffInWeeks} weeks ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  
  // Less than 12 months
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? '1 month ago' : `${diffInMonths} months ago`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return diffInYears === 1 ? '1 year ago' : `${diffInYears} years ago`;
};

/**
 * Format timestamp with fallback to absolute date for very old items
 * @param {string|Date} timestamp - The timestamp to format
 * @param {number} fallbackDays - Days after which to show absolute date (default: 30)
 * @returns {string} Formatted time string
 */
export const formatListingTime = (timestamp, fallbackDays = 30) => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  // For very old listings, show absolute date
  if (diffInDays > fallbackDays) {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  // Otherwise show relative time
  return formatRelativeTime(timestamp);
};

/**
 * Get a more detailed relative time for tooltips or detailed views
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} Detailed relative time string
 */
export const formatDetailedRelativeTime = (timestamp) => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    const seconds = diffInSeconds % 60;
    return seconds > 0 ? `${diffInMinutes} minutes, ${seconds} seconds ago` : `${diffInMinutes} minutes ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    const minutes = diffInMinutes % 60;
    return minutes > 0 ? `${diffInHours} hours, ${minutes} minutes ago` : `${diffInHours} hours ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  const hours = diffInHours % 24;
  
  if (diffInDays < 7) {
    return hours > 0 ? `${diffInDays} days, ${hours} hours ago` : `${diffInDays} days ago`;
  }
  
  // For longer periods, fall back to regular relative time
  return formatRelativeTime(timestamp);
};