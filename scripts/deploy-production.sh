#!/bin/bash
# Production Deployment Script for SlugStop

echo "🚀 Starting SlugStop Production Deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "❌ MongoDB is not running. Please start MongoDB first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Check for environment file
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Please copy .env.production.example to .env and configure."
    echo "   cp .env.production.example .env"
    echo "   Then edit .env with your production values."
    exit 1
fi

echo "✅ Environment file found"

# Setup database
echo "🗄️  Setting up database with METRO routes..."
npm run setup

# Setup admin user (if needed)
echo "👤 Setting up admin user..."
npm run setup-admin

# Test server health
echo "🔍 Testing server health..."
npm start &
SERVER_PID=$!
sleep 10

if npm run health; then
    echo "✅ Server health check passed"
    kill $SERVER_PID
else
    echo "❌ Server health check failed"
    kill $SERVER_PID
    exit 1
fi

echo ""
echo "🎉 SlugStop is ready for production!"
echo ""
echo "📋 Next Steps:"
echo "1. Configure your reverse proxy (nginx/Apache) to serve the app"
echo "2. Set up SSL certificates for HTTPS"
echo "3. Configure process monitoring (PM2, systemd, etc.)"
echo "4. Set up log rotation for production logs"
echo ""
echo "🚀 To start the production server:"
echo "   npm start"
echo ""
echo "📊 To monitor:"
echo "   curl https://yourdomain.com/health"
