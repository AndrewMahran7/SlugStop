require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Database connection
const connectDB = require('./database/connection');

// Middleware
const { logger, errorHandler } = require('./middleware/logger');
const { sanitizeInput } = require('./middleware/validation');

// Import routes
const locationRoutes = require('./routes/location');
const trackRoutes = require('./routes/track');
const adminRoutes = require('./routes/admin');
const riderRoutes = require('./routes/rider');
const driverRoutes = require('./routes/driver');
const metroRoutes = require('./routes/metro');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database
connectDB();

// Create logs directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
}

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
            scriptSrcAttr: ["'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 1000 : 10000, // 1000 requests per 15 minutes in production
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/api/health';
    }
});

app.use('/api/', limiter);

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['https://slugstop.ucsc.edu'] 
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Session configuration with MongoDB store
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/slugstop',
        touchAfter: 24 * 3600 // lazy session update
    }),
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Static files
app.use('/static', express.static(path.join(__dirname, 'frontend/static')));

// View engine setup
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'frontend/templates'));
app.engine('html', require('ejs').renderFile);

// API Routes
app.use('/api/location', locationRoutes);
app.use('/api/track', trackRoutes);
app.use('/admin', adminRoutes);
app.use('/api/rider', riderRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/metro', metroRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// HTML Page Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/templates/home.html'));
});

// Admin routes
app.get('/admin', (req, res) => {
  res.redirect('/admin/login');
});

// Driver routes  
app.get('/driver-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/templates/driver_login.html'));
});

app.get('/driver-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/templates/driver_dashboard.html'));
});

// Rider routes
app.get('/rider', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/templates/rider_get_location.html'));
});

app.get('/rider-select', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/templates/rider_select_driver.html'));
});

app.get('/track', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/templates/track.html'));
});

// METRO routes information
app.get('/metro', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/templates/metro_routes.html'));
});

// Handle Chrome DevTools request silently
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(404).end();
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Handle 404
app.use('*', (req, res) => {
    // Don't log common browser requests
    if (!req.originalUrl.includes('favicon.ico') && 
        !req.originalUrl.includes('.well-known') &&
        !req.originalUrl.includes('apple-touch-icon')) {
        logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`, {
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
    }
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});
