const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { logger } = require('./logger');

const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { 
        expiresIn: '24h',
        issuer: 'slugstop'
    });
};

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

const hashPassword = async (password) => {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    return await bcrypt.hash(password, rounds);
};

const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        // Only log warnings for API routes, not public pages
        if (req.path.startsWith('/api/') || req.path.startsWith('/admin/')) {
            logger.warn('Authentication failed: No token provided', { 
                ip: req.ip,
                path: req.path
            });
        }
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        logger.warn('Authentication failed: Invalid token', { 
            error: error.message,
            ip: req.ip,
            path: req.path
        });
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (req.user.role !== 'admin') {
        logger.warn('Admin access denied', { 
            userId: req.user.id,
            role: req.user.role,
            ip: req.ip,
            path: req.path
        });
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            logger.warn('Authorization failed: Insufficient permissions', {
                userId: req.user.id,
                userRole: req.user.role,
                requiredRoles: roles
            });
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

module.exports = {
    generateToken,
    verifyToken,
    hashPassword,
    comparePassword,
    authenticateToken,
    requireAdmin,
    requireRole
};
