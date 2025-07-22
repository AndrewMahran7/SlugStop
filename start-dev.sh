#!/bin/bash

# SlugStop Development Setup Script

echo "🐌 Setting up SlugStop development environment..."

# Backend setup
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Frontend setup
echo "📦 Installing Node.js dependencies..."
cd frontend
npm install
cd ..

# Create environment file
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration"
fi

# Start services
echo "🚀 Starting development servers..."

# Start backend in background
echo "Starting Flask backend..."
python backend/app.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting React frontend..."
cd frontend
npm start &
FRONTEND_PID=$!

echo "✅ SlugStop is running!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap 'echo "Stopping services..."; kill $BACKEND_PID $FRONTEND_PID; exit' INT
wait
