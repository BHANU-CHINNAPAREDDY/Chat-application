const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registration and email verification routes
router.post('/register', authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-otp', authController.resendOTP);

module.exports = router;
