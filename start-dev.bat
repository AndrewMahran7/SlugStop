@echo off
echo 🐌 Setting up SlugStop development environment...

echo 📦 Installing Python dependencies...
pip install -r requirements.txt

echo 📦 Installing Node.js dependencies...
cd frontend
npm install
cd ..

if not exist .env (
    echo 📝 Creating environment file...
    copy .env.example .env
    echo ⚠️  Please edit .env file with your configuration
)

echo 🚀 Starting development servers...
echo Frontend: http://localhost:3000
echo Backend: http://localhost:5000

start "SlugStop Backend" python backend/app.py
timeout /t 3 /nobreak > nul

cd frontend
start "SlugStop Frontend" npm start
cd ..

echo ✅ SlugStop is running!
pause
