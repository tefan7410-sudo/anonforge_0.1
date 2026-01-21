#!/bin/bash
# AnonForge - Convex Setup Script
# Run this script to initialize your Convex backend

set -e

echo "🚀 Setting up Convex for AnonForge..."
echo ""

# Check if convex is installed
if ! npx convex --version > /dev/null 2>&1; then
  echo "Installing Convex..."
  npm install convex
fi

# Run convex dev to initialize
echo "Starting Convex initialization..."
echo "You will be prompted to:"
echo "  1. Log in to Convex (browser will open)"
echo "  2. Create a new project or select existing"
echo ""

npx convex dev --once

# After init, the CONVEX_URL will be in .env.local
if [ -f ".env.local" ]; then
  # Extract CONVEX_URL and add as VITE_ prefixed for Vite
  CONVEX_URL=$(grep "CONVEX_URL" .env.local | cut -d '=' -f2)
  if [ -n "$CONVEX_URL" ]; then
    echo "VITE_CONVEX_URL=$CONVEX_URL" >> .env.local
    echo "✅ Added VITE_CONVEX_URL to .env.local"
  fi
fi

echo ""
echo "✅ Convex setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run 'npm run dev' to start development"
echo "  2. Run 'npx convex dev' in another terminal for backend"
echo ""
