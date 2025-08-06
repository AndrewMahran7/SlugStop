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
            scriptSrc: ["'self'", "https://unpkg.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More lenient in development
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] 
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
app.use('/api/admin', adminRoutes);
app.use('/api/rider', riderRoutes);
app.use('/api/driver', driverRoutes);

// HTML Page Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/templates/home.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/templates/admin.html'));
});

app.get('/driver-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/templates/driver_login.html'));
});

app.get('/driver-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/templates/driver_dashboard.html'));
});

app.get('/rider', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/templates/rider_get_location.html'));
});

app.get('/rider-confirm', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/templates/rider_confirm_stop.html'));
});

app.get('/rider-select', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/templates/rider_select_driver.html'));
});

app.get('/track', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/templates/track.html'));
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Handle 404
app.use('*', (req, res) => {
    logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});
