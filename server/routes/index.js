const express = require('express')
const registerUser = require('../controller/registerUser')
const checkEmail = require('../controller/checkEmail')
const checkPassword = require('../controller/checkPassword')
const userDetails = require('../controller/userDetails')
const logout = require('../controller/logout')
const updateUserDetails = require('../controller/updateUserDetails')
const searchUser = require('../controller/searchUser')
const verifyEmail = require('../controller/verifyEmail')
const resendOTP = require('../controller/resendOTP')
const sendOTP = require('../controller/sendOTP')
const { getAllUsers, updateUserStatus, deleteUser, isAdmin } = require('../controller/adminController')
const { forgotPassword, resetPassword } = require('../controllers/authController')

const router = express.Router()

//create user api
router.post('/register',registerUser)
//send OTP for email verification
router.post('/send-otp', sendOTP)
//verify email
router.post('/verify-email', verifyEmail)
//resend OTP
router.post('/resend-otp', resendOTP)
//check user email
router.post('/email',checkEmail)
//check user password
router.post('/password',checkPassword)
//login user details
router.get('/user-details',userDetails)
//logout user
router.get('/logout',logout)
//update user details
router.post('/update-user',updateUserDetails)
//search user
router.post('/search-user',searchUser)
//forgot password
router.post('/forgot-password', forgotPassword)
//reset password
router.post('/reset-password', resetPassword)

// Admin routes
router.get('/admin/users', isAdmin, getAllUsers)
router.post('/admin/update-user-status', isAdmin, updateUserStatus)
router.delete('/admin/user/:id', isAdmin, deleteUser)

module.exports = router