import * as crypto from 'crypto';
import * as functions from 'firebase-functions';

// Get the encryption key from environment variables
const ENCRYPTION_KEY = functions.config().db?.encryption_key || 
  process.env.ENCRYPTION_KEY || 
  'default-key-change-in-production'; // Default key for development only

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Encrypts a string using AES-256-CBC
 * @param text The plain text to encrypt
 * @returns The encrypted text as a base64 string with IV prefixed
 */
export const encrypt = (text: string): string => {
  try {
    // Create a random initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create a cipher using the encryption key and iv
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Prefix the IV to the encrypted text for use in decryption
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypts a string encrypted using the encrypt function
 * @param encryptedText The encrypted text with IV prefixed
 * @returns The decrypted plain text
 */
export const decrypt = (encryptedText: string): string => {
  try {
    // Extract the IV from the encrypted text
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedData = textParts[1];
    
    // Create a decipher using the encryption key and iv
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    // Decrypt the text
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};
