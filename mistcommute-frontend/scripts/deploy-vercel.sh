#!/bin/bash

# Vercel deployment script
# This script deploys the frontend to Vercel with a custom project name

set -e

VERCEL_TOKEN="aYwc0Ax4SKofO13G8npi8wjk"
PROJECT_NAME="mistcommute-app-x7k9m2n4p"

echo "🚀 Starting Vercel deployment..."

# Remove existing .vercel directory if it exists
if [ -d ".vercel" ]; then
  echo "🧹 Cleaning up existing .vercel directory..."
  rm -rf .vercel
fi

# Set Vercel token as environment variable
export VERCEL_TOKEN=$VERCEL_TOKEN

# Deploy to Vercel
echo "📦 Deploying to Vercel..."
npx vercel --token $VERCEL_TOKEN --yes --prod

echo "✅ Deployment complete!"
echo ""
echo "📝 Note: To change the project name, visit: https://vercel.com/dashboard"
echo "   The project name will affect the deployment URL."


