# 🐌 SlugStop - UCSC Bus Tracking System

A full-stack, production-ready web application for tracking UCSC buses in real-time. SlugStop allows bus drivers to share their location and enables students to find nearby buses with accurate ETA calculations.

![SlugStop Demo](https://img.shields.io/badge/Status-Production%20Ready-green)
![Python](https://img.shields.io/badge/Python-3.12-blue)
![React](https://img.shields.io/badge/React-18.2-blue)
![Flask](https://img.shields.io/badge/Flask-3.1-blue)

## ✨ Features

### 🚌 For Drivers
- **Simple Login**: Start tracking with just your name
- **Real-time Location Sharing**: Updates every 3 seconds
- **Route Assignment**: Optional route assignment for better ETAs
- **Live Map View**: See your current position on campus map

### 🧍 For Riders
- **Live Bus Tracking**: See all active buses on campus
- **Smart ETAs**: Accurate arrival time calculations
- **Distance Sorting**: Buses sorted by proximity
- **Interactive Map**: Click buses for detailed info
- **Auto-refresh**: Live updates every 5 seconds

### ⚙️ For Administrators
- **Stop Management**: Add/edit/delete bus stops on interactive map
- **Route Creation**: Connect stops to create bus routes
- **Driver Assignment**: Assign drivers to specific routes
- **System Monitoring**: View active drivers and system status

## 🏗️ Architecture

### Backend (Flask + Python)
- **Flask Application Factory**: Modular, scalable architecture
- **JSON File Storage**: No database required - uses JSON files with file locking
- **RESTful API**: Clean API endpoints for all operations
- **Real-time Updates**: Location tracking with 3-second intervals
- **ETA Calculation**: Advanced algorithms using haversine distance and route data

### Frontend (React + Tailwind)
- **Modern React**: Hooks, functional components, React Router
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Interactive Maps**: Leaflet.js for real-time map visualization
- **Real-time Updates**: Automatic refresh and live tracking
- **Beautiful UI**: Tailwind CSS with UCSC branding

### Data Storage
```
data/
├── drivers.json      # Active driver locations and status
├── stops.json        # Bus stop locations and names
├── routes.json       # Route definitions (stop sequences)
└── assignments.json  # Driver-to-route assignments
```

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- Node.js 16+
- npm or yarn

### Development Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd SlugStop
```

2. **Install dependencies**
```bash
# Backend dependencies
pip install -r requirements.txt

# Frontend dependencies
cd frontend
npm install
cd ..
```

3. **Start development servers**

**On Windows:**
```bash
start-dev.bat
```

**On macOS/Linux:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📱 Usage Guide

### For Bus Drivers

1. Navigate to `/driver`
2. Enter your name
3. (Optional) Select your assigned route
4. Click "Start Tracking"
5. Keep the page open while driving
6. Click "Stop Tracking" when your shift ends

### For Students/Riders

1. Navigate to `/rider`
2. Allow location access or use the URL with coordinates
3. View nearby buses sorted by ETA
4. Click on a bus to see detailed route information
5. Use the live map to track bus movement

### For Administrators

1. Navigate to `/admin`
2. **Stops Tab**: Click on map to add new stops
3. **Routes Tab**: Create routes by connecting stops
4. **Assignments Tab**: Assign drivers to routes
5. **Overview Tab**: Monitor system status

## 🌐 API Endpoints

### Driver Endpoints
- `POST /api/driver/start` - Start tracking
- `POST /api/driver/stop` - Stop tracking
- `POST /api/driver/location` - Update location (called every 3s)
- `GET /api/driver/status/<name>` - Get driver status
- `GET /api/driver/all` - Get all active drivers

### Rider Endpoints
- `GET /api/rider/nearby?lat=X&lon=Y` - Find nearby drivers
- `GET /api/rider/driver/<name>/route` - Get driver route details
- `GET /api/rider/stops` - Get all bus stops

### Admin Endpoints
- `GET/POST/PUT/DELETE /api/admin/stops` - Manage stops
- `GET/POST/PUT/DELETE /api/admin/routes` - Manage routes
- `GET/POST/DELETE /api/admin/assignments` - Manage assignments
- `GET /api/admin/status` - System status

## 🚀 Deployment

### Backend Deployment (Render/Railway/Fly.io)

1. **Environment Variables**
```bash
FLASK_ENV=production
SECRET_KEY=your-production-secret-key
PORT=5000
```

2. **Deploy using Render**
- Connect your GitHub repository
- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn --bind 0.0.0.0:$PORT wsgi:app`

### Frontend Deployment (Netlify/Vercel)

1. **Build Settings**
- Build command: `npm run build`
- Publish directory: `frontend/build`

2. **Environment Variables**
```bash
REACT_APP_API_URL=https://your-backend-url.com/api
REACT_APP_ENV=production
```

## 🔧 Configuration

### Backend Configuration
```python
# backend/app.py
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
app.config['DEBUG'] = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
```

### Frontend Configuration
```javascript
// frontend/src/utils/api.js
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});
```

## 📊 System Requirements

### Minimum Requirements
- **Backend**: 512MB RAM, 1 CPU core
- **Frontend**: Static hosting (Netlify/Vercel)
- **Storage**: 100MB for JSON files

### Recommended for Production
- **Backend**: 1GB RAM, 2 CPU cores
- **CDN**: For static assets
- **Monitoring**: Application monitoring service

## 🧪 Testing

### Manual Testing
1. **Driver Flow**: Start tracking → Update location → Stop tracking
2. **Rider Flow**: Find buses → View ETAs → Select bus → View route
3. **Admin Flow**: Add stops → Create routes → Assign drivers

### API Testing
```bash
# Test driver start
curl -X POST http://localhost:5000/api/driver/start \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Driver", "lat": 36.9914, "lon": -122.0609}'

# Test rider search
curl "http://localhost:5000/api/rider/nearby?lat=36.9914&lon=-122.0609"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API endpoints

## 🏆 Acknowledgments

- UC Santa Cruz for inspiration
- Leaflet.js for mapping capabilities
- React community for excellent tooling
- Flask community for the web framework

---

**Made with ❤️ for UC Santa Cruz students**
