const OTPVerification = require("../models/OTPVerification");
const { generateOTP, sendOTPEmail } = require('../utils/emailService');

// Generate OTP
// const generateOTP = () => {
//     return Math.floor(100000 + Math.random() * 900000).toString();
// };

// Send OTP email
// const sendOTPEmail = async (email, otp) => {
//     try {
//         const mailOptions = {
//             from: 'bhanu33725@gmail.com',
//             to: email,
//             subject: 'Email Verification OTP',
//             html: `
//                 <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//                     <h2 style="color: #333;">Email Verification</h2>
//                     <p>Your new verification code is:</p>
//                     <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
//                     <p>This code will expire in 10 minutes.</p>
//                     <p>If you didn't request this code, please ignore this email.</p>
//                 </div>
//             `
//         };

//         await transporter.sendMail(mailOptions);
//         return true;
//     } catch (error) {
//         console.error('Error sending email:', error);
//         return false;
//     }
// };

async function resendOTP(request, response) {
    try {
        const { userId } = request.body;

        const verificationRecord = await OTPVerification.findById(userId);
        if (!verificationRecord) {
            return response.status(404).json({
                message: "Verification record not found",
                error: true
            });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        // Update OTP
        verificationRecord.otp = {
            code: otp,
            expiresAt: otpExpiresAt
        };
        await verificationRecord.save();

        // Send new OTP email
        const emailSent = await sendOTPEmail(verificationRecord.email, otp);
        if (!emailSent) {
            return response.status(500).json({
                message: "Failed to send verification email",
                error: true
            });
        }

        return response.status(200).json({
            message: "New verification code sent successfully",
            success: true
        });
    } catch (error) {
        console.error('Resend OTP error:', error);
        return response.status(500).json({
            message: error.message || error,
            error: true
        });
    }
}

module.exports = resendOTP;
