#!/bin/bash

# GHL Environment Variables Setup Script
# This script sets up GHL credentials as environment variables
# Usage: ./setup-ghl-env.sh [oauth|api_key]

set -e

echo "=== GHL Credentials Setup ==="
echo ""

# Check if running in the correct directory
if [ ! -f "package.json" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Determine connection type
CONNECTION_TYPE=${1:-oauth}

if [ "$CONNECTION_TYPE" != "oauth" ] && [ "$CONNECTION_TYPE" != "api_key" ]; then
    echo "Error: Connection type must be 'oauth' or 'api_key'"
    echo "Usage: ./setup-ghl-env.sh [oauth|api_key]"
    exit 1
fi

echo "Setting up $CONNECTION_TYPE connection..."
echo ""

# Create or update .env.local file
ENV_FILE=".env.local"

# Backup existing file if it exists
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo "Backed up existing $ENV_FILE"
fi

# Remove old GHL variables from .env.local
if [ -f "$ENV_FILE" ]; then
    grep -v "^GHL_" "$ENV_FILE" > "$ENV_FILE.tmp" || true
    mv "$ENV_FILE.tmp" "$ENV_FILE"
fi

# Add new GHL variables
echo "" >> "$ENV_FILE"
echo "# GHL Integration Settings" >> "$ENV_FILE"
echo "GHL_CONNECTION_TYPE=$CONNECTION_TYPE" >> "$ENV_FILE"

if [ "$CONNECTION_TYPE" == "oauth" ]; then
    echo ""
    echo "Please enter your GHL OAuth credentials:"
    echo ""
    
    read -p "Access Token: " ACCESS_TOKEN
    read -p "Refresh Token: " REFRESH_TOKEN
    read -p "Location ID (optional): " LOCATION_ID
    read -p "Location Name (optional): " LOCATION_NAME
    read -p "Company ID (optional): " COMPANY_ID
    
    echo "GHL_ACCESS_TOKEN=$ACCESS_TOKEN" >> "$ENV_FILE"
    echo "GHL_REFRESH_TOKEN=$REFRESH_TOKEN" >> "$ENV_FILE"
    
    if [ -n "$LOCATION_ID" ]; then
        echo "GHL_LOCATION_ID=$LOCATION_ID" >> "$ENV_FILE"
    fi
    
    if [ -n "$LOCATION_NAME" ]; then
        echo "GHL_LOCATION_NAME=$LOCATION_NAME" >> "$ENV_FILE"
    fi
    
    if [ -n "$COMPANY_ID" ]; then
        echo "GHL_COMPANY_ID=$COMPANY_ID" >> "$ENV_FILE"
    fi
    
    echo ""
    echo "OAuth credentials saved!"
    
else
    echo ""
    echo "Please enter your GHL API Key:"
    echo ""
    
    read -p "API Key: " API_KEY
    read -p "Location ID (optional): " LOCATION_ID
    read -p "Location Name (optional): " LOCATION_NAME
    
    echo "GHL_API_KEY=$API_KEY" >> "$ENV_FILE"
    
    if [ -n "$LOCATION_ID" ]; then
        echo "GHL_LOCATION_ID=$LOCATION_ID" >> "$ENV_FILE"
    fi
    
    if [ -n "$LOCATION_NAME" ]; then
        echo "GHL_LOCATION_NAME=$LOCATION_NAME" >> "$ENV_FILE"
    fi
    
    echo ""
    echo "API Key saved!"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Credentials have been saved to $ENV_FILE"
echo ""
echo "To apply these changes:"
echo "  1. Restart your Next.js development server"
echo "  2. Or redeploy if in production"
echo ""
echo "To verify the connection, go to Admin > Integrations and click 'Test Connection'"
