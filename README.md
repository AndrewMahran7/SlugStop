# SlugStop - UCSC Campus Bus Tracking System

A comprehensive real-time bus tracking platform for UC Santa Cruz, featuring the complete Santa Cruz METRO bus system integration.

## 🚌 Features

- **Real-time Bus Tracking**: Live location tracking for all METRO bus routes
- **Smart ETA Calculations**: Combines scheduled and real-time data for accurate arrival predictions  
- **Interactive Maps**: Leaflet.js-powered maps showing bus locations and routes
- **Multi-Role System**: Support for riders, drivers, and administrators
- **METRO Integration**: All 9 major Santa Cruz METRO routes with 25+ stops
- **Production Ready**: Security hardened, rate limited, and performance optimized

## 🏗 Architecture

- **Backend**: Node.js + Express.js
- **Database**: MongoDB with geospatial indexing
- **Frontend**: Vanilla JavaScript + Leaflet.js maps
- **Authentication**: JWT-based with bcrypt password hashing
- **Security**: Helmet.js, CORS protection, rate limiting, input sanitization

## 📋 Production Deployment

### Prerequisites

- Node.js 18+
- MongoDB 5.0+
- SSL certificates for HTTPS (recommended)
- Node.js (version 16 or higher)
### Quick Start

1. **Clone and Setup**
```bash
git clone <repository-url>
cd SlugStop_Copilot
npm ci --only=production
```

2. **Configure Environment**
```bash
cp .env.production.example .env
# Edit .env with your production values
```

3. **Deploy**
```bash
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh
```

4. **Start Production Server**
```bash
npm start
```

### Manual Setup

1. **Install Dependencies**
```bash
npm ci --only=production
```

2. **Setup Database**
```bash
npm run setup
```

3. **Create Admin User**
```bash
npm run setup-admin
```

4. **Start Server**
```bash
NODE_ENV=production npm start
```

## 🔧 Configuration

### Environment Variables

```env
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/slugstop
SESSION_SECRET=your-super-secure-session-secret
ALLOWED_ORIGINS=https://slugstop.ucsc.edu
JWT_SECRET=your-jwt-secret
PORT=3000
```

### CORS Configuration
Configure `ALLOWED_ORIGINS` in your .env file with comma-separated domains:
```
ALLOWED_ORIGINS=https://slugstop.ucsc.edu,https://www.slugstop.ucsc.edu
```

## 🚀 Production Features

### Security
- Helmet.js security headers
- Rate limiting (1000 requests/15min)
- CORS protection
- Input sanitization
- Secure session management
- JWT authentication

### Monitoring
- Health check endpoints: `/health` and `/api/health`
- Structured logging with Winston
- Error handling and reporting

### Performance
- MongoDB indexing for geospatial queries
- Efficient ETA calculations
- Optimized real-time data updates
- Static file serving with Express

## 📱 User Flows

### For Riders
1. Visit `/rider` to get location
2. View nearby buses on interactive map
3. Track selected bus in real-time
4. Get accurate ETA predictions

### For Drivers
1. Login at `/driver-login`
2. Access driver dashboard
3. Update location and status

### For Administrators  
1. Login at `/admin/login`
2. Monitor system statistics
3. Manage drivers and routes

## 🗺 METRO Routes Included

- **Route 1**: Soquel / Cabrillo / Airport
- **Route 2**: Capitola / Cabrillo / Main  
- **Route 11**: UCSC via West Gate
- **Route 17**: Highway 17 Express
- **Route 18**: UCSC via Main Gate
- **Route 19**: UCSC via West Gate (Lower Bay)
- **Route 20**: UCSC via Main Gate (Delaware/Western)
- **Route 35**: Highway 9 / Scotts Valley
- **Route 75**: Green Valley – Wheelock

## 🔗 API Endpoints

### Public API
