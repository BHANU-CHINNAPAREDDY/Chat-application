const GroupModel = require('../models/GroupModel');
const { MessageModel } = require('../models/ConversationModel');

// Create a new group
async function createGroup({ groupName, creatorId, memberIds }) {
    const group = new GroupModel({
        name: groupName,
        members: [creatorId, ...memberIds],
        admins: [creatorId],
        createdBy: creatorId,
        messages: []
    });
    await group.save();
    return group;
}

// Add a message to a group
async function addGroupMessage({ groupId, senderId, text, imageUrl = '', videoUrl = '' }) {
    const message = new MessageModel({
        text,
        imageUrl,
        videoUrl,
        msgByUserId: senderId,
        seen: false
    });
    await message.save();
    await GroupModel.findByIdAndUpdate(groupId, { $push: { messages: message._id } });
    return message;
}

// Fetch group messages
async function getGroupMessages(groupId) {
    const group = await GroupModel.findById(groupId)
        .populate({
            path: 'messages',
            populate: { path: 'msgByUserId', select: 'name email profile_pic' }
        })
        .populate('members', 'name email profile_pic');
    return group ? group.messages : [];
}

module.exports = {
    createGroup,
    addGroupMessage,
    getGroupMessages
};
