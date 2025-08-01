/**
 * Timezone utility functions for handling Pacific Time (PST/PDT)
 * California automatically switches between PST and PDT based on daylight saving time
 */

/**
 * Get current timestamp in Pacific timezone
 * @returns {Date} Current date/time in Pacific timezone
 */
export const getPacificTimestamp = () => {
  return new Date().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles"
  });
};

/**
 * Convert UTC timestamp to Pacific timezone
 * @param {Date|string} utcTimestamp - UTC timestamp to convert
 * @returns {string} Formatted Pacific time string
 */
export const convertToPacific = (utcTimestamp) => {
  const date = new Date(utcTimestamp);
  return date.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Format timestamp for display in Pacific timezone
 * @param {Date|string} timestamp - Timestamp to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted timestamp string
 */
export const formatPacificTime = (timestamp, options = {}) => {
  const defaultOptions = {
    timeZone: "America/Los_Angeles",
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", { ...defaultOptions, ...options });
};

/**
 * Get Pacific timezone offset information
 * @returns {Object} Timezone information
 */
export const getPacificTimezoneInfo = () => {
  const now = new Date();
  const pacificTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const utcTime = new Date(now.toUTCString());
  const offsetHours = (utcTime.getTime() - pacificTime.getTime()) / (1000 * 60 * 60);
  
  // Determine if it's currently PST or PDT
  const isDST = offsetHours === 7; // PDT is UTC-7, PST is UTC-8
  
  return {
    offset: isDST ? -7 : -8,
    isDaylightSaving: isDST,
    abbreviation: isDST ? 'PDT' : 'PST',
    name: isDST ? 'Pacific Daylight Time' : 'Pacific Standard Time'
  };
};