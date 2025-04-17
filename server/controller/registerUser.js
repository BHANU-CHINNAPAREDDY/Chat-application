const UserModel = require("../models/UserModel")
const bcryptjs = require('bcryptjs')

async function registerUser(request,response){
    try {
        const { name, email, password, profile_pic } = request.body

        console.log('Registration request received for email:', email);

        const checkEmail = await UserModel.findOne({ email })

        if(checkEmail){
            return response.status(400).json({
                message : "Already user exits",
                error : true,
            })
        }

        //password into hashpassword
        const salt = await bcryptjs.genSalt(10)
        const hashpassword = await bcryptjs.hash(password,salt)

        // Check if this is the first user
        const userCount = await UserModel.countDocuments();
        const isFirstUser = userCount === 0;

        const payload = {
            name,
            email,
            profile_pic,
            password: hashpassword,
            isAdmin: isFirstUser, // First user becomes admin
            isEmailVerified: true // Email is already verified through OTP
        }

        const user = new UserModel(payload)
        await user.save()

        return response.status(201).json({
            message : "User registered successfully",
            success : true,
        })

    } catch (error) {
        console.error('Registration error:', error);
        return response.status(500).json({
            message : error.message || error,
            error : true,
        })
    }
}

module.exports = registerUser