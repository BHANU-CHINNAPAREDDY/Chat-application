const express = require('express');
const router = express.Router();
const GroupModel = require('../models/GroupModel');
const getUserDetailsFromToken = require('../helpers/getUserDetailsFromToken');
const { MessageModel } = require('../models/ConversationModel');
const UserModel = require('../models/UserModel');

// Middleware to get user from token
async function authMiddleware(req, res, next) {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1] || "";
        if (!token) return res.status(401).json({ message: 'Authentication required' });
        const user = await getUserDetailsFromToken(token);
        if (!user || user.message === "session out") return res.status(401).json({ message: 'Invalid or expired token' });
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Authentication failed', error: error.message });
    }
}

// Get all users except the current user (for group creation)
router.get('/users', authMiddleware, async (req, res) => {
    try {
        const users = await UserModel.find({ _id: { $ne: req.user._id } }, 'name email profile_pic');
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// List all groups for the user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const groups = await GroupModel.find({ members: req.user._id })
            .populate('members', 'name email profile_pic')
            .populate('admins', 'name email profile_pic')
            .select('-messages');
        res.json({ success: true, groups });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create a new group
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, memberIds } = req.body;
        if (!name || !Array.isArray(memberIds)) return res.status(400).json({ message: 'Invalid input' });
        const group = new GroupModel({
            name,
            members: [req.user._id, ...memberIds],
            admins: [req.user._id],
            createdBy: req.user._id,
            messages: []
        });
        await group.save();
        res.status(201).json({ success: true, group });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get group details and messages
router.get('/:groupId', authMiddleware, async (req, res) => {
    try {
        const group = await GroupModel.findById(req.params.groupId)
            .populate('members', 'name email profile_pic')
            .populate('admins', 'name email profile_pic')
            .populate({
                path: 'messages',
                populate: { path: 'msgByUserId', select: 'name email profile_pic' }
            });
        if (!group) return res.status(404).json({ message: 'Group not found' });
        if (!group.members.some(m => m._id.equals(req.user._id))) return res.status(403).json({ message: 'Not a group member' });
        res.json({ success: true, group });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
