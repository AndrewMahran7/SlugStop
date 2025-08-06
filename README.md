# SlugStop - UCSC Campus Bus Tracking System

A real-time bus tracking system for UCSC campus transportation, built with Node.js, Express, MongoDB, and modern web technologies.

## Features

- **Real-time Bus Tracking**: Live GPS tracking of campus buses with geospatial indexing
- **Driver Dashboard**: Secure interface for drivers to start/stop location sharing
- **Rider Interface**: Find closest stops and track selected buses with ETA calculations
- **Admin Portal**: Complete management system for stops, routes, and drivers
- **Interactive Maps**: Powered by Leaflet.js with OpenStreetMap integration
- **QR Code Integration**: Scannable QR codes at bus stops for instant access
- **Authentication & Security**: JWT tokens, bcrypt password hashing, rate limiting
- **Database Persistence**: MongoDB with Mongoose ODM for reliable data storage
- **Production Ready**: Comprehensive logging, error handling, and security middleware

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Maps**: Leaflet.js with OpenStreetMap
- **Authentication**: JWT tokens with bcrypt password hashing
- **Security**: Helmet, express-validator, rate limiting, input sanitization
- **Logging**: Winston with structured logging
- **Environment**: dotenv for configuration management

## Installation

### Prerequisites
- Node.js (version 16 or higher)
- npm (Node Package Manager)
- MongoDB (running on localhost:27017)

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/AndrewMahran7/SlugStop.git
   cd SlugStop
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # .env file is already configured for local development
   # Default MongoDB connection: mongodb://localhost:27017/slugstop
   # Default port: 3001
   ```

4. **Complete admin setup (recommended)**
   ```bash
   npm run admin-setup
   ```
   This single command will:
   - Install any missing dependencies
   - Check MongoDB connection
   - Create admin account (admin/admin123)
   - Create 4 driver accounts
   - Set up real UCSC bus stops
   - Generate QR codes for all stops

5. **Start the application**
   ```bash
   npm start
   ```

6. **Access the application**
   - Main app: `http://localhost:3001`
   - Admin dashboard: `http://localhost:3001/admin`

## Project Structure

```
SlugStop/
├── app.js                    # Main Express application
├── package.json              # Dependencies and scripts
├── .env                      # Environment configuration
├── seed.js                   # Database seeding script
├── create-admin.js           # Admin & driver account creation
├── update-stops.js           # Real UCSC bus stop coordinates
├── generate-qr-codes.js      # QR code generation for stops
├── setup-admin.js            # Complete admin setup script
├── models/                   # MongoDB schemas
│   ├── Driver.js            # Driver/admin user model
│   ├── Stop.js              # Bus stop model with geospatial indexing
│   ├── Route.js             # Bus route model
│   └── BusLocation.js       # Real-time location tracking
├── routes/                   # API route handlers
│   ├── admin.js             # Admin management with authentication
│   ├── driver.js            # Driver authentication & management
│   ├── location.js          # Real-time location tracking
│   ├── rider.js             # Rider interface & stop finding
│   └── track.js             # Bus tracking functionality
├── middleware/              # Custom middleware
│   ├── auth.js              # JWT authentication & authorization
│   ├── validation.js        # Input validation & sanitization
│   └── logger.js            # Winston logging configuration
├── frontend/
│   ├── static/              # CSS and JavaScript files
│   │   ├── admin.css        # Admin dashboard styling
│   │   ├── admin.js         # Admin dashboard functionality
│   │   ├── driver_dashboard.js # Driver interface
│   │   ├── driver.js        # Driver login handling
│   │   ├── map.js           # Interactive mapping functionality
│   │   ├── track.js         # Real-time tracking interface
│   │   └── ...              # Other frontend assets
│   └── templates/           # HTML templates
│       ├── admin.html       # Legacy admin interface
│       ├── admin_dashboard.html # Modern admin dashboard
│       ├── driver_dashboard.html # Driver control panel
│       ├── driver_login.html # Driver authentication
│       ├── home.html        # Main landing page
│       ├── track.html       # Bus tracking interface
│       └── ...              # Other HTML templates
└── qrcodes/
    ├── generated/           # Generated QR codes for stops
    └── generate_qrs.py      # Legacy QR generation (replaced)
```

## NPM Scripts

### Core Application
- `npm start` - Start the production server
- `npm run dev` - Start with nodemon for development
- `npm run seed` - Seed database with default data
- `npm run reset` - Reset and reseed database

### Admin Setup
- `npm run admin-setup` - **Complete admin setup (recommended)**
- `npm run setup-admin` - Create admin and driver accounts only
- `npm run setup-drivers` - Create driver accounts only
- `npm run update-stops` - Update stops with real UCSC coordinates
- `npm run generate-qr` - Generate QR codes for all stops

## Admin System

### Admin Account
- **Username**: `admin`
- **Password**: `admin123` (change after first login)
- **Access URL**: `http://localhost:3001/admin`

### Admin Features
- **Dashboard**: Real-time statistics and active driver monitoring
- **Driver Management**: View, create, and manage driver accounts
- **Stop Management**: Add, edit, and manage bus stops with GPS coordinates
- **Route Management**: Create and manage bus routes with stop sequences
- **QR Code Management**: Generate and print QR codes for bus stops
- **System Monitoring**: View active drivers, system stats, and logs

### Default Driver Accounts
- `driver1` / `driver123` (Bus 101)
- `driver2` / `driver456` (Bus 102)
- `driver3` / `driver789` (Bus 103)
- `driver4` / `driver101` (Bus 104)

## API Endpoints

### Authentication
- `POST /admin/login` - Admin authentication with JWT
- `POST /api/driver/login` - Driver authentication
- `GET /api/driver/session` - Check driver session
- `POST /api/driver/logout` - Logout driver

### Admin API (Requires Admin Authentication)
- `GET /admin/dashboard` - Dashboard statistics and active drivers
- `GET /admin/data` - Get stops and routes data
- `POST /admin/save_stop` - Create new bus stop
- `POST /admin/save_route` - Create new route
- `GET /admin/drivers` - Get all drivers
- `PUT /admin/drivers/:id` - Update driver information

### Location API
- `POST /api/location` - Update bus location (GeoJSON format)
- `GET /api/location` - Get all active bus locations

### Rider API
- `GET /api/rider/stops` - Get all bus stops with coordinates
- `POST /api/rider/find-closest` - Find closest stop to user location
- `POST /api/rider/drivers` - Get available drivers with ETA calculations

### Track API
- `GET /api/track/data` - Get real-time tracking data (buses and stops)

## Database Models

### Driver Model
```javascript
{
  name: String,           // Driver display name
  code: String,           // Hashed password/code
  role: 'driver'|'admin', // User role
  busNumber: String,      // Assigned bus number
  onShift: Boolean,       // Currently working
  isActive: Boolean,      // Account active status
  currentLocation: {      // Current GPS location (GeoJSON)
    type: 'Point',
    coordinates: [longitude, latitude],
    timestamp: Date
  }
}
```

### Stop Model
```javascript
{
  name: String,          // Stop display name
  location: {            // GPS coordinates (GeoJSON Point)
    type: 'Point',
    coordinates: [longitude, latitude]
  },
  description: String,   // Stop description
  isActive: Boolean     // Stop active status
}
```

### Route Model
```javascript
{
  name: String,         // Route name
  driver: ObjectId,     // Assigned driver reference
  stops: [{            // Ordered list of stops
    stop: ObjectId,    // Stop reference
    order: Number      // Stop sequence number
  }],
  isActive: Boolean    // Route active status
}
```

### BusLocation Model
```javascript
{
  driver: ObjectId,     // Driver reference
  location: {           // GPS coordinates (GeoJSON Point)
    type: 'Point',
    coordinates: [longitude, latitude]
  },
  timestamp: Date,      // Location timestamp
  accuracy: Number,     // GPS accuracy in meters
  heading: Number,      // Direction (0-360 degrees)
  speed: Number        // Speed in km/h
}
```

## Real Bus Stop Locations

The system includes 12 real UCSC campus locations:

1. **Main Entrance** - Bay & High Street
2. **Quarry Plaza** - Student Services and Dining
3. **Science Hill** - Physical & Biological Sciences
4. **Crown/Merrill** - Crown and Merrill Colleges
5. **Porter/Kresge** - Porter and Kresge Colleges
6. **Cowell/Stevenson** - Cowell and Stevenson Colleges
7. **East Remote** - East Remote Parking Lot
8. **West Remote** - West Remote Parking Lot
9. **Village** - Graduate Student Housing
10. **Bookstore** - Campus Bookstore & Bay Tree Building
11. **Health Center** - Student Health Center
12. **Recreation Center** - East Field House & Recreation

## QR Code System

### QR Code Generation
```bash
npm run generate-qr
```

### QR Code Features
- Individual PNG files for each stop
- Professional print sheet at `/qrcodes/generated/print_all_qr_codes.html`
- Direct links to tracking page with stop pre-selected
- Scannable from any smartphone camera

### QR Code Deployment
1. Generate QR codes using the script
2. Print the HTML sheet or individual PNG files
3. Laminate for weather protection
4. Post at corresponding physical bus stop locations

## Usage Guide

### For System Administrators

1. **Initial Setup**
   ```bash
   npm run admin-setup
   ```

2. **Access Admin Dashboard**
   - URL: `http://localhost:3001/admin`
   - Login with admin/admin123
   - Change default password immediately

3. **Manage Drivers**
   - View active drivers and their status
   - Create new driver accounts
   - Assign bus numbers
   - Monitor real-time locations

4. **Manage Stops and Routes**
   - Add new bus stops with GPS coordinates
   - Create routes by selecting stops in order
   - Assign drivers to routes
   - Generate QR codes for new stops

### For Bus Drivers

1. **Login**
   - Go to `/driver-login`
   - Enter your assigned username and password
   - Click "Start Tracking" to begin location sharing

2. **During Shift**
   - Your location is automatically shared every few seconds
   - Riders can see your real-time location and ETA
   - Use the dashboard to start/stop tracking

3. **End Shift**
   - Click "Stop Tracking" to end location sharing
   - Logout to complete your shift

### For Riders

1. **Find Your Stop**
   - Go to the main page `/`
   - Click "Find Closest Stop" to use GPS
   - Or manually select from the list of stops

2. **Track Buses**
   - View available drivers and their ETAs
   - Select a driver to track in real-time
   - See live location updates on the map

3. **Using QR Codes**
   - Scan QR code at any bus stop
   - Automatically opens tracking for that stop
   - No need to manually select your location

## Security Features

### Authentication & Authorization
- JWT tokens with secure secret keys
- Bcrypt password hashing (12 rounds)
- Role-based access control (admin/driver)
- Session management with MongoDB store

### Input Validation & Sanitization
- Express-validator for all API inputs
- MongoDB injection prevention
- XSS protection with sanitization
- CORS configuration for secure origins

### Security Headers & Rate Limiting
- Helmet middleware for security headers
- Rate limiting to prevent abuse
- Secure cookie configuration
- Environment-based security settings

### Logging & Monitoring
- Winston structured logging
- Request/response logging
- Error tracking and debugging
- Admin action audit trail

## Production Deployment

### Environment Configuration
```bash
# Update .env for production
NODE_ENV=production
PORT=80
MONGODB_URI=your_production_mongodb_url
JWT_SECRET=your_super_secure_jwt_secret
SESSION_SECRET=your_super_secure_session_secret
```

### SSL/HTTPS Setup
```bash
# Required for GPS location access in production
# Set up SSL certificate or reverse proxy
```

### MongoDB Setup
```bash
# Ensure MongoDB is properly configured with:
# - Proper indexes for geospatial queries
# - Backup and recovery procedures
# - Performance monitoring
```

## Development

### Adding New Features
1. Create new route handlers in `routes/`
2. Add database models in `models/` if needed
3. Update frontend in `frontend/static/` and `frontend/templates/`
4. Add validation middleware for new endpoints
5. Update API documentation

### Database Operations
```bash
# Reset database
npm run reset

# Seed with fresh data
npm run seed

# Update stops only
npm run update-stops
```

### Debugging
- Check logs in console output (Winston logging)
- MongoDB connection issues: Ensure MongoDB is running on localhost:27017
- Port conflicts: Update PORT in .env file
- Authentication issues: Check JWT_SECRET configuration

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Ensure MongoDB is running: `mongod`
   - Check connection string in .env
   - Verify MongoDB is accessible on localhost:27017

2. **Port Already in Use**
   - Update PORT in .env file
   - Kill existing process: `taskkill /PID <pid> /F`
   - Use different port (e.g., 3001, 3002)

3. **QR Code Generation Failed**
   - Install qrcode package: `npm install qrcode`
   - Check file permissions in qrcodes/ directory
   - Ensure MongoDB connection for stop data

4. **Admin Login Issues**
   - Run admin setup: `npm run setup-admin`
   - Check if admin account exists in database
   - Verify JWT_SECRET in .env file

5. **GPS Location Not Working**
   - Use HTTPS in production (required for geolocation)
   - Check browser permissions for location access
   - Verify CORS configuration for your domain

### Performance Optimization

- MongoDB indexes are automatically created for geospatial queries
- Location updates are rate-limited to prevent spam
- Session management uses MongoDB for scalability
- Static assets can be served via CDN in production

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Follow the existing code style and patterns
4. Add tests for new functionality
5. Update documentation as needed
6. Commit your changes (`git commit -m 'Add new feature'`)
7. Push to the branch (`git push origin feature/new-feature`)
8. Open a Pull Request

## License

This project is licensed under the MIT License.

## Contact

For questions or support, please contact the development team or create an issue in the repository.

---

**🚌 Happy Bus Tracking! 🎓**
4. Update `app.js` to register new routes

### Modifying Bus Stops
Edit `state/stopsState.js` to add or modify predefined bus stops.

### Customizing Maps
The application uses Leaflet.js with OpenStreetMap. You can customize map tiles by modifying the tileLayer configuration in the JavaScript files.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Contact

For questions or support, please contact the development team or create an issue in the repository.
