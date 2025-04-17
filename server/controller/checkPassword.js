const UserModel = require("../models/UserModel")
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')

async function checkPassword(request,response){
    try {
        const { password, userId } = request.body

        const user = await UserModel.findById(userId)

        // Check if user exists
        if (!user) {
            return response.status(404).json({
                message: "User not found",
                error: true
            });
        }

        // Check if user is approved
        if (!user.isApproved) {
            return response.status(403).json({
                message: "Your account is pending approval from admin",
                error: true
            });
        }

        // Check if user is rejected
        if (user.status === 'rejected') {
            return response.status(403).json({
                message: "Your account has been rejected by admin",
                error: true
            });
        }

        const verifyPassword = await bcryptjs.compare(password,user.password)

        if(!verifyPassword){
            return response.status(400).json({
                message : "Please check password",
                error : true
            })
        }

        const tokenData = {
            id : user._id,
            email : user.email,
            isAdmin: user.isAdmin
        }
        const token = await jwt.sign(tokenData,process.env.JWT_SECREAT_KEY,{ expiresIn : '1d'})

        const cookieOptions = {
            http : true,
            secure : true
        }

        return response.cookie('token',token,cookieOptions).status(200).json({
            message : "Login successfully",
            token : token,
            isAdmin: user.isAdmin,
            success :true
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true
        })
    }
}

module.exports = checkPassword