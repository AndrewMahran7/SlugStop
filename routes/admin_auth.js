// Admin Authentication Routes
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Admin } = require('../setup_admin');

const router = express.Router();

// Admin login endpoint
router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find admin by email
        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if admin is active
        if (!admin.isActive) {
            return res.status(401).json({ error: 'Account is deactivated' });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                adminId: admin._id, 
                email: admin.email,
                role: admin.role,
                permissions: admin.permissions 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        res.json({
            success: true,
            token,
            admin: {
                id: admin._id,
                email: admin.email,
                name: admin.name,
                role: admin.role,
                permissions: admin.permissions
            }
        });

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Middleware to verify admin token
const verifyAdminToken = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Dashboard data endpoint
router.get('/dashboard', verifyAdminToken, async (req, res) => {
    try {
        // Mock data for now - replace with real database queries
        const dashboardData = {
            stats: {
                activeDrivers: 12,
                totalStops: 45,
                totalRoutes: 9,
                totalDrivers: 18
            },
            activeDrivers: [
                {
                    id: 1,
                    name: 'John Smith',
                    busNumber: '101',
                    onShift: true,
                    route: 'Route 10'
                },
                {
                    id: 2,
                    name: 'Sarah Johnson',
                    busNumber: '205',
                    onShift: true,
                    route: 'Route 3'
                },
                {
                    id: 3,
                    name: 'Mike Wilson',
                    busNumber: '312',
                    onShift: false,
                    route: 'Route 20'
                }
            ]
        };

        res.json(dashboardData);
    } catch (error) {
        console.error('Dashboard data error:', error);
        res.status(500).json({ error: 'Failed to load dashboard data' });
    }
});

// Get admin profile
router.get('/profile', verifyAdminToken, async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.adminId).select('-password');
        res.json(admin);
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Failed to load profile' });
    }
});

// Change password
router.post('/change-password', verifyAdminToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new passwords are required' });
        }

        const admin = await Admin.findById(req.admin.adminId);
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        admin.password = hashedNewPassword;
        await admin.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// Logout endpoint (client-side token removal)
router.post('/logout', verifyAdminToken, (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = { router, verifyAdminToken };
