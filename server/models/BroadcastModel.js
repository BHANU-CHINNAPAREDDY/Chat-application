const mongoose = require('mongoose')

const broadcastMessageSchema = new mongoose.Schema({
    text: {
        type: String,
        default: ""
    },
    imageUrl: {
        type: String,
        default: ""
    },
    videoUrl: {
        type: String,
        default: ""
    },
    sender: {
        type: mongoose.Schema.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true
})

const BroadcastModel = mongoose.model('Broadcast', broadcastMessageSchema)

module.exports = BroadcastModel
