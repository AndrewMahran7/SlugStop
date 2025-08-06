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
    isActive: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date
    },
    currentLocation: {
        latitude: Number,
        longitude: Number,
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

// Method to update location
driverSchema.methods.updateLocation = function(latitude, longitude) {
    this.currentLocation = {
        latitude,
        longitude,
        timestamp: new Date()
    };
    return this.save();
};

module.exports = mongoose.model('Driver', driverSchema);
