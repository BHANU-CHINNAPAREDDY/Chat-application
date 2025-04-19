const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    members: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }],
    admins: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }],
    messages: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Message'
    }],
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

const GroupModel = mongoose.model('Group', groupSchema);

module.exports = GroupModel;
