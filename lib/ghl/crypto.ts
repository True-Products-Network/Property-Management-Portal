import CryptoJS from "crypto-js";

// Encryption key should be stored in environment variable
const ENCRYPTION_KEY = process.env.GHL_ENCRYPTION_KEY || "your-fallback-key-change-in-production";

/**
 * Encrypt text using AES-256-CBC with random IV
 * Returns base64 string containing IV + ciphertext
 */
export function encrypt(text: string): string {
  try {
    // Generate random IV (16 bytes for AES)
    const iv = CryptoJS.lib.WordArray.random(16);
    
    // Encrypt
    const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    
    // Combine IV and ciphertext
    const combined = iv.concat(encrypted.ciphertext);
    return combined.toString(CryptoJS.enc.Base64);
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt text using AES-256-CBC
 * Expects base64 string containing IV + ciphertext
 */
export function decrypt(encryptedText: string): string {
  try {
    // Parse base64
    const combined = CryptoJS.enc.Base64.parse(encryptedText);
    
    // Extract IV (first 16 bytes) and ciphertext
    const iv = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4));
    const ciphertext = CryptoJS.lib.WordArray.create(combined.words.slice(4));
    
    // Create cipher params
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: ciphertext,
    });
    
    // Decrypt
    const decrypted = CryptoJS.AES.decrypt(cipherParams, ENCRYPTION_KEY, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Generate a secure encryption key
 * Run this once and store the result in GHL_ENCRYPTION_KEY env var
 */
export function generateEncryptionKey(): string {
  return CryptoJS.lib.WordArray.random(32).toString();
}
