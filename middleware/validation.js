const { body, query, param, validationResult } = require('express-validator');
const mongoSanitize = require('express-mongo-sanitize');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

// Driver validation rules
const validateDriverLogin = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name must contain only letters and spaces'),
    body('code')
        .isLength({ min: 4, max: 20 })
        .matches(/^[a-zA-Z0-9]+$/)
        .withMessage('Code must be alphanumeric'),
    handleValidationErrors
];

// Location validation rules
const validateLocation = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Name is required'),
    body('lat')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be between -90 and 90'),
    body('lon')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be between -180 and 180'),
    body('timestamp')
        .optional()
        .isISO8601()
        .withMessage('Timestamp must be valid ISO 8601 date'),
    handleValidationErrors
];

// Stop validation rules
const validateStop = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .matches(/^[a-zA-Z0-9\s\-_]+$/)
        .withMessage('Stop name must be alphanumeric with spaces, hyphens, or underscores'),
    body('lat')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be between -90 and 90'),
    body('lon')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be between -180 and 180'),
    handleValidationErrors
];

// Route validation rules
const validateRoute = [
    body('route_name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .matches(/^[a-zA-Z0-9\s\-_]+$/)
        .withMessage('Route name must be alphanumeric with spaces, hyphens, or underscores'),
    body('driver')
        .trim()
        .isLength({ min: 2, max: 50 })
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Driver name must contain only letters and spaces'),
    body('stops')
        .isArray({ min: 1 })
        .withMessage('At least one stop is required'),
    body('stops.*')
        .trim()
        .isLength({ min: 1 })
        .withMessage('Stop names cannot be empty'),
    handleValidationErrors
];

// Coordinates validation for rider requests
const validateCoordinates = [
    body('lat')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be between -90 and 90'),
    body('lon')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be between -180 and 180'),
    handleValidationErrors
];

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
    // Remove any keys that start with '$' or contain '.'
    mongoSanitize.sanitize(req.body);
    mongoSanitize.sanitize(req.query);
    mongoSanitize.sanitize(req.params);
    next();
};

module.exports = {
    validateDriverLogin,
    validateLocation,
    validateStop,
    validateRoute,
    validateCoordinates,
    sanitizeInput,
    handleValidationErrors
};
