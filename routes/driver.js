const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { validateDriverLogin } = require('../middleware/validation');
const { logger } = require('../middleware/logger');

// Driver login
router.post('/login', validateDriverLogin, async (req, res) => {
  try {
    const { name, code } = req.body;
    
    // Find driver by name
    let driver = await Driver.findOne({ name: name.trim() });
    
    // If driver doesn't exist, create new one (for demo purposes)
    if (!driver) {
      driver = new Driver({ name: name.trim(), code });
      await driver.save();
      logger.info(`New driver registered: ${name}`);
    } else {
      // Verify code
      const isValidCode = await driver.compareCode(code);
      if (!isValidCode) {
        logger.warn(`Invalid login attempt for driver: ${name}`, { ip: req.ip });
        return res.status(401).json({ error: 'Invalid name or code.' });
      }
    }
    
    // Update driver status and last login
    driver.isActive = true;
    driver.lastLogin = new Date();
    await driver.save();
    
    // Generate JWT token
    const token = generateToken({
      id: driver._id,
      name: driver.name,
      role: 'driver'
    });
    
    // Store in session as backup
    req.session.driver_id = driver._id;
    req.session.driver_name = driver.name;
    
    logger.info(`Driver logged in: ${name}`);
    res.json({ 
      success: true, 
      driver_name: driver.name,
      token: token
    });
    
  } catch (error) {
    logger.error('Driver login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Check driver session
router.get('/session', async (req, res) => {
  try {
    // Check session first
    if (req.session.driver_id) {
      const driver = await Driver.findById(req.session.driver_id);
      if (driver && driver.isActive) {
        return res.json({ driver_name: driver.name });
      }
    }
    
    res.status(401).json({ error: 'Not logged in' });
  } catch (error) {
    logger.error('Session check error:', error);
    res.status(500).json({ error: 'Session check failed' });
  }
});

// Driver logout
router.post('/logout', async (req, res) => {
  try {
    if (req.session.driver_id) {
      // Update driver status
      await Driver.findByIdAndUpdate(req.session.driver_id, { 
        isActive: false 
      });
      
      logger.info(`Driver logged out: ${req.session.driver_name}`);
    }
    
    req.session.destroy((err) => {
      if (err) {
        logger.error('Session destroy error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true });
    });
  } catch (error) {
    logger.error('Driver logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;
