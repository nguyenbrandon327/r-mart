// Utility functions for image optimization

/**
 * Generate a blur placeholder data URL with specified color
 * @param {string} color - Hex color (e.g., '#f3f4f6')
 * @returns {string} - Data URL for blur placeholder
 */
export const generateBlurDataURL = (color = '#f3f4f6') => {
  // Create a simple 10x10 SVG with the specified color
  const svg = `
    <svg width="10" height="10" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

/**
 * Generate a gradient blur placeholder
 * @param {string} fromColor - Starting color
 * @param {string} toColor - Ending color
 * @returns {string} - Data URL for gradient blur placeholder
 */
export const generateGradientBlurDataURL = (fromColor = '#f3f4f6', toColor = '#e5e7eb') => {
  const svg = `
    <svg width="10" height="10" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${fromColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${toColor};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

/**
 * Standard blur data URL for product images
 */
export const PRODUCT_BLUR_DATA_URL = generateGradientBlurDataURL('#f9fafb', '#f3f4f6');

/**
 * Standard blur data URL for profile images
 */
export const PROFILE_BLUR_DATA_URL = generateBlurDataURL('#e5e7eb');

/**
 * Standard blur data URL for banner/hero images
 */
export const BANNER_BLUR_DATA_URL = generateGradientBlurDataURL('#1f2937', '#374151');
