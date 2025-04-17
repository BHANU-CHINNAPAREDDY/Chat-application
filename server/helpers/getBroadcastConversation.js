const BroadcastModel = require('../models/BroadcastModel')

const getBroadcastConversation = async (userId) => {
    // Get the last broadcast message
    const lastBroadcastMessage = await BroadcastModel.findOne()
        .sort({ createdAt: -1 })
        .populate('sender', 'name email profile_pic')

    if (!lastBroadcastMessage) {
        return null
    }

    // Return conversation-like structure for broadcast
    return {
        _id: 'broadcast',
        sender: lastBroadcastMessage.sender,
        receiver: lastBroadcastMessage.sender,
        lastMsg: {
            text: lastBroadcastMessage.text,
            imageUrl: lastBroadcastMessage.imageUrl,
            videoUrl: lastBroadcastMessage.videoUrl,
            createdAt: lastBroadcastMessage.createdAt
        },
        userDetails: {
            _id: 'broadcast',
            name: 'Broadcast Messages',
            profile_pic: '',
            email: ''
        }
    }
}

module.exports = getBroadcastConversation
