"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEncryptionConfig = exports.reEncrypt = exports.decrypt = exports.encrypt = void 0;
const crypto = require("crypto");
const functions = require("firebase-functions");
// Get the encryption key from environment variables
const ENCRYPTION_KEY = ((_a = functions.config().db) === null || _a === void 0 ? void 0 : _a.encryption_key) ||
    process.env.ENCRYPTION_KEY ||
    'default-key-change-in-production'; // Default key for development only
// While using a default key is OK for development, it's critical to set a proper key in production
if (process.env.NODE_ENV === 'production' &&
    ENCRYPTION_KEY === 'default-key-change-in-production') {
    console.error('WARNING: Using default encryption key in production environment.');
    console.error('Set a proper encryption key using: firebase functions:config:set db.encryption_key="YOUR_SECURE_KEY"');
}
const ALGORITHM = 'aes-256-gcm'; // Using more secure GCM mode
const IV_LENGTH = 16; // For AES, this is always 16
const AUTH_TAG_LENGTH = 16; // For GCM mode
// Salt for key derivation - should be stored securely in production
const KEY_SALT = ((_b = functions.config().db) === null || _b === void 0 ? void 0 : _b.key_salt) ||
    process.env.KEY_SALT ||
    'default-salt-change-in-production';
/**
 * Encrypts a string using AES-256-GCM
 *
 * @param text The plain text to encrypt
 * @returns The encrypted text as a base64 string with IV and auth tag prefixed
 */
const encrypt = (text) => {
    if (!text) {
        throw new Error('Cannot encrypt empty text');
    }
    try {
        // Create a random initialization vector
        const iv = crypto.randomBytes(IV_LENGTH);
        // Create a cipher using the encryption key and iv
        const key = crypto.scryptSync(ENCRYPTION_KEY, KEY_SALT, 32);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
            authTagLength: AUTH_TAG_LENGTH
        });
        // Encrypt the text
        let encrypted = cipher.update(text, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        // Get the authentication tag
        const authTag = cipher.getAuthTag();
        // Format: iv:authTag:encryptedData
        return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    }
    catch (error) {
        console.error('Encryption error:', error);
        throw new Error(`Failed to encrypt data: ${error.message}`);
    }
};
exports.encrypt = encrypt;
/**
 * Decrypts a string encrypted using the encrypt function
 *
 * @param encryptedText The encrypted text with IV and auth tag prefixed
 * @returns The decrypted plain text
 */
const decrypt = (encryptedText) => {
    if (!encryptedText) {
        throw new Error('Cannot decrypt empty text');
    }
    try {
        // Extract the IV, auth tag, and encrypted data
        const textParts = encryptedText.split(':');
        // Check if the format is correct
        if (textParts.length !== 3) {
            // Try old format (backward compatibility)
            if (textParts.length === 2) {
                return decryptLegacy(encryptedText);
            }
            throw new Error('Invalid encrypted text format');
        }
        const iv = Buffer.from(textParts[0], 'hex');
        const authTag = Buffer.from(textParts[1], 'hex');
        const encryptedData = textParts[2];
        // Create a decipher using the encryption key and iv
        const key = crypto.scryptSync(ENCRYPTION_KEY, KEY_SALT, 32);
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
            authTagLength: AUTH_TAG_LENGTH
        });
        // Set auth tag
        decipher.setAuthTag(authTag);
        // Decrypt the text
        let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (error) {
        console.error('Decryption error:', error);
        throw new Error(`Failed to decrypt data: ${error.message}`);
    }
};
exports.decrypt = decrypt;
/**
 * Decrypts a string encrypted using the old AES-256-CBC method
 *
 * @param encryptedText The encrypted text with IV prefixed (old format)
 * @returns The decrypted plain text
 */
const decryptLegacy = (encryptedText) => {
    try {
        // Extract the IV from the encrypted text
        const textParts = encryptedText.split(':');
        const iv = Buffer.from(textParts[0], 'hex');
        const encryptedData = textParts[1];
        // Create a decipher using the encryption key and iv
        const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32); // Using old salt value
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        // Decrypt the text
        let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (error) {
        console.error('Legacy decryption error:', error);
        throw new Error(`Failed to decrypt data with legacy method: ${error.message}`);
    }
};
/**
 * Re-encrypts data using the current encryption method
 * Useful for migrating data encrypted with old methods
 *
 * @param encryptedText The text encrypted with any supported method
 * @returns Text re-encrypted with the current method
 */
const reEncrypt = (encryptedText) => {
    const decrypted = (0, exports.decrypt)(encryptedText);
    return (0, exports.encrypt)(decrypted);
};
exports.reEncrypt = reEncrypt;
/**
 * Verify if the encryption configuration is properly set up
 *
 * @returns Boolean indicating if encryption is properly configured
 */
const verifyEncryptionConfig = () => {
    try {
        const testText = 'encryption-test-' + Date.now();
        const encrypted = (0, exports.encrypt)(testText);
        const decrypted = (0, exports.decrypt)(encrypted);
        return decrypted === testText;
    }
    catch (error) {
        console.error('Encryption configuration verification failed:', error);
        return false;
    }
};
exports.verifyEncryptionConfig = verifyEncryptionConfig;
//# sourceMappingURL=encryption.js.map