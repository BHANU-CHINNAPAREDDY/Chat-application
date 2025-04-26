const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'bhanu33725@gmail.com',
        pass: 'wdwccrutojshlgwe'
    },
    debug: true
});

// Verify transporter connection
transporter.verify(function(error, success) {
    if (error) {
        console.log('SMTP connection error:', error);
    } else {
        console.log('SMTP server is ready to send messages');
    }
});

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateResetToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

const sendOTPEmail = async (email, otp) => {
    try {
        console.log('Attempting to send email to:', email);
        console.log('Using OTP:', otp);
        
        const mailOptions = {
            from: {
                name: 'Chat Application',
                address: 'bhanu33725@gmail.com'
            },
            to: email,
            subject: 'Email Verification OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Email Verification</h2>
                    <p>Your verification code is:</p>
                    <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
                    <p>This code will expire in 10 minutes.</p>
                    <p>If you didn't request this code, please ignore this email.</p>
                </div>
            `
        };

        console.log('Mail options configured:', mailOptions);
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.response);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

const sendPasswordResetEmail = async (email, resetToken) => {
    try {
        const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
        
        const mailOptions = {
            from: {
                name: 'Chat Application',
                address: 'bhanu33725@gmail.com'
            },
            to: email,
            subject: 'Password Reset Request',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p>You requested to reset your password. Click the button below to reset it:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
                    </div>
                    <p>Or copy and paste this link in your browser:</p>
                    <p style="background-color: #f5f5f5; padding: 10px; word-break: break-all;">${resetUrl}</p>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent successfully:', info.response);
        return true;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return false;
    }
};

// Send status update email to user (improved template)
const sendStatusUpdateEmail = async (email, status, message) => {
    try {
        let subject = '';
        let html = '';
        if (status === 'approved') {
            subject = 'Registration Approved - Chat Application';
            html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4CAF50;">Registration Approved</h2>
                    <p>Dear user,</p>
                    <p>Congratulations! Your registration has been <b>approved</b> by the admin. You can now log in and use the chat app.</p>
                    <p>If you have any questions, please contact support.</p>
                    <br>
                    <p>Best regards,<br>Chat Application Team</p>
                </div>
            `;
        } else if (status === 'rejected') {
            subject = 'Registration Rejected - Chat Application';
            html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #d32f2f;">Registration Rejected</h2>
                    <p>Dear user,</p>
                    <p>We regret to inform you that your registration has been <b>rejected</b> by the admin. Please contact support for more information.</p>
                    <br>
                    <p>Best regards,<br>Chat Application Team</p>
                </div>
            `;
        } else if (status === 'deleted') {
            subject = 'Account Deleted - Chat Application';
            html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #d32f2f;">Account Deleted</h2>
                    <p>Dear user,</p>
                    <p>Your registration/account has been <b>deleted</b> by the admin. If you believe this is a mistake, please contact support.</p>
                    <br>
                    <p>Best regards,<br>Chat Application Team</p>
                </div>
            `;
        } else {
            subject = 'Registration Status Update - Chat Application';
            html = `<div><p>${message}</p></div>`;
        }
        const mailOptions = {
            from: {
                name: 'Chat Application',
                address: 'bhanu33725@gmail.com'
            },
            to: email,
            subject,
            html
        };
        const info = await transporter.sendMail(mailOptions);
        console.log('Status update email sent:', info.response);
        return true;
    } catch (error) {
        console.error('Error sending status update email:', error);
        return false;
    }
};

module.exports = {
    generateOTP,
    sendOTPEmail,
    generateResetToken,
    sendPasswordResetEmail,
    sendStatusUpdateEmail
};
