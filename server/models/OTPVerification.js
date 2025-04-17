const mongoose = require('mongoose');

const otpVerificationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "provide email"],
        unique: true
    },
    otp: {
        code: {
            type: String,
            required: true
        },
        expiresAt: {
            type: Date,
            required: true
        }
    }
}, {
    timestamps: true
});

const OTPVerification = mongoose.model('OTPVerification', otpVerificationSchema);

module.exports = OTPVerification;
