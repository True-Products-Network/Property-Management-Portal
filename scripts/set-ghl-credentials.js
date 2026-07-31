#!/usr/bin/env node

/**
 * Set GHL Credentials Script
 * 
 * This script stores GHL credentials in the database (encrypted)
 * Usage: node scripts/set-ghl-credentials.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('=== GHL Credentials Setup ===\n');
  
  const type = await question('Connection type (oauth/api_key): ');
  
  if (type !== 'oauth' && type !== 'api_key') {
    console.error('Error: Type must be "oauth" or "api_key"');
    process.exit(1);
  }
  
  let credentials = { type };
  
  if (type === 'oauth') {
    console.log('\nEnter OAuth credentials:');
    credentials.accessToken = await question('Access Token: ');
    credentials.refreshToken = await question('Refresh Token: ');
    credentials.locationId = await question('Location ID (optional): ');
    credentials.locationName = await question('Location Name (optional): ');
    credentials.companyId = await question('Company ID (optional): ');
  } else {
    console.log('\nEnter API Key credentials:');
    credentials.apiKey = await question('API Key: ');
    credentials.locationId = await question('Location ID (optional): ');
    credentials.locationName = await question('Location Name (optional): ');
  }
  
  console.log('\n--- Summary ---');
  console.log('Type:', credentials.type);
  console.log('Location:', credentials.locationName || 'Not specified');
  console.log('\nTo save these credentials, make a POST request to:');
  console.log('  /api/admin/ghl/connect');
  console.log('\nWith this JSON body:');
  console.log(JSON.stringify(credentials, null, 2));
  
  rl.close();
}

main().catch(console.error);
