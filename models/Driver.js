const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const driverSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    code: {
        type: String,
        required: true,
        unique: true,
        minlength: 4,
        maxlength: 20
    },
    role: {
        type: String,
        enum: ['driver', 'admin'],
        default: 'driver'
    },
    busNumber: {
        type: String,
        sparse: true, // Allows multiple null values
        maxlength: 10
    },
    onShift: {
        type: Boolean,
        default: false
    },
    shiftStart: {
        type: Date
    },
    shiftEnd: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date
    },
    currentLocation: {
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: {
            type: [Number],
            validate: {
                validator: function(coords) {
                    if (!coords || coords.length === 0) return true; // Allow empty/null
                    return coords.length === 2 && 
                           coords[1] >= -90 && coords[1] <= 90 &&  // latitude
                           coords[0] >= -180 && coords[0] <= 180;  // longitude
                },
                message: 'Coordinates must be [longitude, latitude] with valid ranges'
            }
        },
        timestamp: Date
    }
}, {
    timestamps: true
});

// Hash the code before saving
driverSchema.pre('save', async function(next) {
    if (!this.isModified('code')) return next();
    
    try {
        const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        this.code = await bcrypt.hash(this.code, rounds);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare codes
driverSchema.methods.compareCode = async function(candidateCode) {
    return await bcrypt.compare(candidateCode, this.code);
};

// Method to start shift
driverSchema.methods.startShift = function() {
    this.onShift = true;
    this.shiftStart = new Date();
    this.isActive = true;
    return this.save();
};

// Method to end shift
driverSchema.methods.endShift = function() {
    this.onShift = false;
    this.shiftEnd = new Date();
    this.isActive = false;
    return this.save();
};

// Check if user is admin
driverSchema.methods.isAdmin = function() {
    return this.role === 'admin';
};

// Static method to find active drivers
driverSchema.statics.findActiveDrivers = function() {
    return this.find({ 
        isActive: true, 
        onShift: true,
        role: 'driver'
    }).select('name busNumber currentLocation onShift');
};

// Method to update location
driverSchema.methods.updateLocation = function(latitude, longitude) {
    this.currentLocation = {
        type: 'Point',
        coordinates: [longitude, latitude],
        timestamp: new Date()
    };
    return this.save();
};

// Virtual properties for easier access to current location
driverSchema.virtual('currentLatitude').get(function() {
    return this.currentLocation?.coordinates?.[1];
});

driverSchema.virtual('currentLongitude').get(function() {
    return this.currentLocation?.coordinates?.[0];
});

module.exports = mongoose.model('Driver', driverSchema);
