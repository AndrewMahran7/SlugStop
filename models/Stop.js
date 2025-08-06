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
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true,
            validate: {
                validator: function(coords) {
                    return coords.length === 2 && 
                           coords[1] >= -90 && coords[1] <= 90 &&  // latitude
                           coords[0] >= -180 && coords[0] <= 180;  // longitude
                },
                message: 'Coordinates must be [longitude, latitude] with valid ranges'
            }
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

// Create geospatial index
stopSchema.index({ location: "2dsphere" });

// Virtual properties for easier access
stopSchema.virtual('latitude').get(function() {
    return this.location.coordinates[1];
});

stopSchema.virtual('longitude').get(function() {
    return this.location.coordinates[0];
});

// Method to set coordinates
stopSchema.methods.setCoordinates = function(latitude, longitude) {
    this.location = {
        type: 'Point',
        coordinates: [longitude, latitude]
    };
};

// Method to find nearby stops
stopSchema.statics.findNearby = function(longitude, latitude, maxDistance = 1000) {
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
