const UserModel = require('../models/UserModel');
const jwt = require('jsonwebtoken');
const { sendStatusUpdateEmail } = require('../utils/emailService');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.split(' ')[1];
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECREAT_KEY);
        if (!decoded || !decoded.id) {
            return res.status(401).json({ message: "Invalid token" });
        }

        // Check if user exists and is admin
        const user = await UserModel.findById(decoded.id);
        if (!user || !user.isAdmin) {
            return res.status(403).json({ message: "Access denied. Admin only." });
        }

        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token" });
        }
        res.status(500).json({ message: "Error checking admin status", error: error.message });
    }
};

// Get all users grouped by status
const getAllUsers = async (req, res) => {
    try {
        const [pendingUsers, approvedUsers, rejectedUsers] = await Promise.all([
            UserModel.find({ status: 'pending' }).select('-password').sort({ createdAt: -1 }),
            UserModel.find({ status: 'approved' }).select('-password').sort({ createdAt: -1 }),
            UserModel.find({ status: 'rejected' }).select('-password').sort({ createdAt: -1 })
        ]);

        res.status(200).json({
            pending: pendingUsers,
            approved: approvedUsers,
            rejected: rejectedUsers
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching users", error: error.message });
    }
};

// Approve or reject user
const updateUserStatus = async (req, res) => {
    const { userId, action } = req.body;
    
    if (!['approved', 'rejected'].includes(action)) {
        return res.status(400).json({ message: "Invalid action" });
    }

    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.status = action;
        user.isApproved = action === 'approved';
        await user.save();

        // Send email notification to user
        let statusMessage = '';
        if (action === 'approved') {
            statusMessage = 'Congratulations! Your registration has been approved by the admin. You can now log in and use the chat app.';
        } else if (action === 'rejected') {
            statusMessage = 'We regret to inform you that your registration has been rejected by the admin. Please contact support for more information.';
        }
        await sendStatusUpdateEmail(user.email, action, statusMessage);

        // Return updated user lists
        const [pendingUsers, approvedUsers, rejectedUsers] = await Promise.all([
            UserModel.find({ status: 'pending' }).select('-password').sort({ createdAt: -1 }),
            UserModel.find({ status: 'approved' }).select('-password').sort({ createdAt: -1 }),
            UserModel.find({ status: 'rejected' }).select('-password').sort({ createdAt: -1 })
        ]);

        res.status(200).json({
            message: `User ${action} successfully`,
            users: {
                pending: pendingUsers,
                approved: approvedUsers,
                rejected: rejectedUsers
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error updating user status", error: error.message });
    }
};

// Delete user
const deleteUser = async (req, res) => {
    // Fix: Use req.params.id, not req.params.userId
    const userId = req.params.id;

    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isAdmin) {
            return res.status(403).json({ message: "Cannot delete admin user" });
        }

        await UserModel.findByIdAndDelete(userId);

        // Send email notification to user
        const statusMessage = 'Your registration/account has been deleted by the admin. If you believe this is a mistake, please contact support.';
        await sendStatusUpdateEmail(user.email, 'deleted', statusMessage);

        // Return updated user lists
        const [pendingUsers, approvedUsers, rejectedUsers] = await Promise.all([
            UserModel.find({ status: 'pending' }).select('-password').sort({ createdAt: -1 }),
            UserModel.find({ status: 'approved' }).select('-password').sort({ createdAt: -1 }),
            UserModel.find({ status: 'rejected' }).select('-password').sort({ createdAt: -1 })
        ]);

        res.status(200).json({
            message: "User deleted successfully",
            users: {
                pending: pendingUsers,
                approved: approvedUsers,
                rejected: rejectedUsers
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error deleting user", error: error.message });
    }
};

module.exports = {
    getAllUsers,
    updateUserStatus,
    deleteUser,
    isAdmin
};
