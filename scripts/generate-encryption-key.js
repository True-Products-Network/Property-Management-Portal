#!/usr/bin/env node

/**
 * Generate Encryption Key for GHL Credentials
 * 
 * Run this once and add the output to your .env.local as GHL_ENCRYPTION_KEY
 */

const crypto = require('crypto');

function generateKey() {
  // Generate a 256-bit (32-byte) key
  return crypto.randomBytes(32).toString('hex');
}

console.log('=== GHL Encryption Key Generator ===\n');
console.log('Add this to your .env.local file:\n');
console.log('GHL_ENCRYPTION_KEY=' + generateKey());
console.log('\n⚠️  IMPORTANT: Keep this key secure!');
console.log('   If you lose it, you cannot decrypt stored credentials.');
