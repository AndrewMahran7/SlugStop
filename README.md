# SlugStop - UCSC Campus Bus Tracking System

A real-time bus tracking system for UCSC campus transportation, built with Node.js, Express, and JavaScript.

## Features

- **Real-time Bus Tracking**: Live GPS tracking of campus buses
- **Driver Dashboard**: Interface for drivers to start/stop location sharing
- **Rider Interface**: Find closest stops and track selected buses
- **Admin Portal**: Manage bus stops and routes
- **Interactive Maps**: Powered by Leaflet.js with OpenStreetMap
- **ETA Calculations**: Real-time estimated arrival times

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML, CSS, JavaScript
- **Maps**: Leaflet.js with OpenStreetMap
- **Sessions**: Express-session for driver authentication
- **Data Storage**: JSON files for persistent storage

## Installation

### Prerequisites
- Node.js (version 14 or higher)
- npm (Node Package Manager)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/AndrewMahran7/SlugStop.git
   cd SlugStop
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   # For development (with auto-reload)
   npm run dev
   
   # For production
   npm start
   ```

4. **Access the application**
   Open your browser and go to `http://localhost:3000`

## Project Structure

```
SlugStop/
├── app.js                 # Main application file
├── package.json           # Node.js dependencies
├── routes/               # API route handlers
│   ├── admin.js         # Admin management routes
│   ├── driver.js        # Driver authentication routes
│   ├── location.js      # Location tracking routes
│   ├── rider.js         # Rider interface routes
│   └── track.js         # Tracking routes
├── state/               # State management modules
│   ├── adminState.js    # Admin data management
│   ├── busState.js      # Bus location state
│   └── stopsState.js    # Bus stops data
├── frontend/
│   ├── static/          # CSS and JavaScript files
│   └── templates/       # HTML templates
└── data/
    └── routes.json      # Persistent data storage
```

## API Endpoints

### Location API
- `POST /api/location` - Update bus location
- `GET /api/location` - Get all bus locations

### Driver API
- `POST /api/driver/login` - Driver authentication
- `GET /api/driver/session` - Check driver session
- `POST /api/driver/logout` - Logout driver

### Rider API
- `GET /api/rider/stops` - Get all bus stops
- `POST /api/rider/find-closest` - Find closest stop to user
- `POST /api/rider/drivers` - Get available drivers with ETA

### Admin API
- `GET /api/admin/data` - Get stops and routes data
- `POST /api/admin/save_stop` - Save new bus stop
- `POST /api/admin/save_route` - Save new route

### Track API
- `GET /api/track/data` - Get tracking data (buses and stops)

## Usage

### For Drivers
1. Go to `/driver-login`
2. Enter your name and driver code
3. Click "Start Tracking" to begin location sharing
4. Your location will be shared with riders in real-time

### For Riders
1. Go to `/rider`
2. Click "Find Closest Stop" to use GPS location
3. Or manually select a stop
4. Confirm your stop selection
5. View available drivers and their ETAs
6. Select a driver to track in real-time

### For Admins
1. Go to `/admin`
2. Click on the map to add new bus stops
3. Create routes by selecting stops and assigning drivers
4. View saved stops and routes

## Default Driver Codes
- John: 1234
- Jane: 5678
- Sam: abcd

## Development

### Adding New Features
1. Create new route handlers in the `routes/` directory
2. Add corresponding HTML templates in `frontend/templates/`
3. Add JavaScript and CSS files in `frontend/static/`
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
