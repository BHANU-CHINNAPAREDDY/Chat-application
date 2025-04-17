const OTPVerification = require("../models/OTPVerification");

async function verifyEmail(request, response) {
    try {
        const { userId, otp } = request.body;

        const verificationRecord = await OTPVerification.findById(userId);
        if (!verificationRecord) {
            return response.status(404).json({
                message: "Verification record not found",
                error: true
            });
        }

        if (!verificationRecord.otp || !verificationRecord.otp.code || !verificationRecord.otp.expiresAt) {
            return response.status(400).json({
                message: "OTP not found",
                error: true
            });
        }

        if (Date.now() > verificationRecord.otp.expiresAt) {
            return response.status(400).json({
                message: "OTP has expired",
                error: true
            });
        }

        if (verificationRecord.otp.code !== otp) {
            return response.status(400).json({
                message: "Invalid OTP",
                error: true
            });
        }

        // Delete the verification record after successful verification
        await OTPVerification.findByIdAndDelete(userId);

        return response.status(200).json({
            message: "Email verified successfully",
            success: true
        });
    } catch (error) {
        console.error('Email verification error:', error);
        return response.status(500).json({
            message: error.message || error,
            error: true
        });
    }
}

module.exports = verifyEmail;
