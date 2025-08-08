import crypto from 'crypto';

// Generate a secure 256-bit (32 bytes) encryption key
const encryptionKey = crypto.randomBytes(32).toString('hex');

console.log('Generated 256-bit encryption key:');
console.log(encryptionKey);
console.log('');
console.log('Add this to your .env file as:');
console.log(`ENCRYPTION_KEY=${encryptionKey}`);

