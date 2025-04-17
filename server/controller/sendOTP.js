const UserModel = require("../models/UserModel");
const OTPVerification = require("../models/OTPVerification");
const { generateOTP, sendOTPEmail } = require('../utils/emailService');

async function sendOTP(request, response) {
    try {
        const { email } = request.body;

        // Check if email exists in Users
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return response.status(400).json({
                message: "Email already registered",
                error: true
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        // Update or create OTP verification record
        const verificationRecord = await OTPVerification.findOneAndUpdate(
            { email },
            {
                email,
                otp: {
                    code: otp,
                    expiresAt: otpExpiresAt
                }
            },
            { upsert: true, new: true }
        );

        // Send OTP email
        const emailSent = await sendOTPEmail(email, otp);
        if (!emailSent) {
            return response.status(500).json({
                message: "Failed to send verification email",
                error: true
            });
        }

        return response.status(200).json({
            message: "OTP sent successfully",
            userId: verificationRecord._id,
            success: true
        });

    } catch (error) {
        console.error('Send OTP error:', error);
        return response.status(500).json({
            message: error.message || error,
            error: true
        });
    }
}

module.exports = sendOTP;
