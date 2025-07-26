import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

// Get encryption key from environment variable
const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  
  // If key is a hex string, convert to buffer
  if (key.length === 64) {
    return Buffer.from(key, 'hex');
  }
  
  // Otherwise, hash the key to ensure it's 256 bits
  return crypto.scryptSync(key, 'salt', KEY_LENGTH);
};

/**
 * Encrypt a string value
 * @param {string} text - Text to encrypt
 * @returns {string} - Encrypted text in format: iv:encrypted:authTag (all hex)
 */
export const encrypt = (text) => {
  if (!text || text === null || text === undefined) {
    return null;
  }
  
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from('location-data', 'utf8'));
    
    let encrypted = cipher.update(text.toString(), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Return format: iv:encrypted:authTag (all hex)
    return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt an encrypted string
 * @param {string} encryptedData - Encrypted data in format: iv:encrypted:authTag
 * @returns {string} - Decrypted text
 */
export const decrypt = (encryptedData) => {
  if (!encryptedData || encryptedData === null || encryptedData === undefined) {
    return null;
  }
  
  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(Buffer.from('location-data', 'utf8'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Encrypt user location fields
 * @param {Object} locationData - Object containing custom_address, custom_latitude, custom_longitude
 * @returns {Object} - Object with encrypted fields
 */
export const encryptLocationData = (locationData) => {
  const encrypted = {};
  
  if (locationData.custom_address) {
    encrypted.custom_address = encrypt(locationData.custom_address);
  }
  
  if (locationData.custom_latitude) {
    encrypted.custom_latitude = encrypt(locationData.custom_latitude.toString());
  }
  
  if (locationData.custom_longitude) {
    encrypted.custom_longitude = encrypt(locationData.custom_longitude.toString());
  }
  
  return encrypted;
};

/**
 * Decrypt user location fields
 * @param {Object} encryptedData - Object containing encrypted location fields
 * @returns {Object} - Object with decrypted fields
 */
export const decryptLocationData = (encryptedData) => {
  const decrypted = {};
  
  if (encryptedData.custom_address) {
    decrypted.custom_address = decrypt(encryptedData.custom_address);
  }
  
  if (encryptedData.custom_latitude) {
    const decryptedLat = decrypt(encryptedData.custom_latitude);
    decrypted.custom_latitude = decryptedLat ? parseFloat(decryptedLat) : null;
  }
  
  if (encryptedData.custom_longitude) {
    const decryptedLng = decrypt(encryptedData.custom_longitude);
    decrypted.custom_longitude = decryptedLng ? parseFloat(decryptedLng) : null;
  }
  
  return decrypted;
}; 