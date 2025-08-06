const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 100
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
    isActive: {
        type: Boolean,
        default: true
    },
    description: {
        type: String,
        maxlength: 200
    }
}, {
    timestamps: true
});

// Create index for geospatial queries
stopSchema.index({ "location": "2dsphere" });

// Method to find nearby stops
stopSchema.statics.findNearby = function(latitude, longitude, maxDistance = 1000) {
    return this.find({
        location: {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [longitude, latitude]
                },
                $maxDistance: maxDistance
            }
        },
        isActive: true
    });
};

module.exports = mongoose.model('Stop', stopSchema);
