const getUserDetailsFromToken = require("../helpers/getUserDetailsFromToken")
const UserModel = require("../models/UserModel")

async function updateUserDetails(request, response) {
    try {
        const token = request.cookies.token || request.headers.authorization?.split(' ')[1] || "";

        if (!token) {
            return response.status(401).json({
                message: "Authentication required",
                error: true
            });
        }

        const user = await getUserDetailsFromToken(token)
        
        if (!user || user.message === "session out") {
            return response.status(401).json({
                message: "Invalid or expired token",
                error: true
            });
        }

        const { name, profile_pic } = request.body

        if (!name || name.trim().length < 2) {
            return response.status(400).json({
                message: "Name is required and must be at least 2 characters",
                error: true
            });
        }

        const updateUser = await UserModel.findByIdAndUpdate(
            user._id,
            {
                name: name.trim(),
                profile_pic
            },
            { new: true }
        ).select('-password');

        if (!updateUser) {
            return response.status(404).json({
                message: "User not found",
                error: true
            });
        }

        return response.json({
            message: "Profile updated successfully",
            data: updateUser,
            success: true
        });

    } catch (error) {
        console.error("Update user error:", error);
        return response.status(500).json({
            message: error.message || "Internal server error",
            error: true
        });
    }
}

module.exports = updateUserDetails