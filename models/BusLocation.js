const mongoose = require('mongoose');

const busLocationSchema = new mongoose.Schema({
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        required: true
    },
    location: {
        latitude: {
            type: Number,
            required: true,
            min: -90,
            max: 90
        },
        longitude: {
            type: Number,
            required: true,
            min: -180,
            max: 180
        }
    },
    timestamp: {
        type: Date,
        default: Date.now,
        expires: 86400 // Auto-delete after 24 hours
    },
    accuracy: {
        type: Number,
        default: 0
    },
    heading: {
        type: Number,
        min: 0,
        max: 360
    },
    speed: {
        type: Number,
        min: 0
    }
}, {
    timestamps: true
});

// Create index for geospatial queries
busLocationSchema.index({ "location": "2dsphere" });
busLocationSchema.index({ "driver": 1, "timestamp": -1 });

// Method to get latest location for driver
busLocationSchema.statics.getLatestLocation = function(driverId) {
    return this.findOne({ driver: driverId })
        .sort({ timestamp: -1 })
        .populate('driver');
};

// Method to get location history
busLocationSchema.statics.getLocationHistory = function(driverId, hours = 1) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.find({ 
        driver: driverId,
        timestamp: { $gte: since }
    }).sort({ timestamp: -1 });
};

module.exports = mongoose.model('BusLocation', busLocationSchema);
