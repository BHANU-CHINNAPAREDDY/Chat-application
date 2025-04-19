const express = require('express')
const { Server } = require('socket.io')
const http  = require('http')
const getUserDetailsFromToken = require('../helpers/getUserDetailsFromToken')
const UserModel = require('../models/UserModel')
const { ConversationModel,MessageModel } = require('../models/ConversationModel')
const BroadcastModel = require('../models/BroadcastModel')
const getConversation = require('../helpers/getConversation')
const getBroadcastConversation = require('../helpers/getBroadcastConversation')
const GroupModel = require('../models/GroupModel')
const { createGroup, addGroupMessage, getGroupMessages } = require('../helpers/groupChat')

const app = express()

/***socket connection */
const server = http.createServer(app)
const io = new Server(server,{
    cors : {
        origin : process.env.FRONTEND_URL,
        credentials : true
    }
})

/***
 * socket running at http://localhost:8080/
 */

//online user
const onlineUser = new Set()

io.on('connection',async(socket)=>{
    console.log("connect User ", socket.id)

    const token = socket.handshake.auth.token 

    //current user details 
    const user = await getUserDetailsFromToken(token)

    // Check if user is valid and has _id
    if (!user || !user._id) {
        console.log("Invalid user connection attempt:", socket.id);
        socket.emit('auth_error', { message: 'Authentication failed' });
        socket.disconnect(true);
        return;
    }

    //create a room
    socket.join(user._id.toString())
    onlineUser.add(user._id.toString())

    // Join all group rooms the user is a member of
    const userGroups = await GroupModel.find({ members: user._id })
    userGroups.forEach(group => {
        socket.join(group._id.toString())
    })

    io.emit('onlineUser',Array.from(onlineUser))

    socket.on('message-page',async(userId)=>{
        console.log('userId',userId)
        const userDetails = await UserModel.findById(userId).select("-password")
        
        if (!userDetails) {
            socket.emit('user_error', { message: 'User not found' });
            return;
        }

        const payload = {
            _id : userDetails._id,
            name : userDetails.name,
            email : userDetails.email,
            profile_pic : userDetails.profile_pic,
            online : onlineUser.has(userId)
        }

        socket.emit('message-user',payload)


         //get previous message
         const getConversationMessage = await ConversationModel.findOne({
            "$or" : [
                { sender : user?._id, receiver : userId },
                { sender : userId, receiver :  user?._id}
            ]
        }).populate('messages').sort({ updatedAt : -1 })

        socket.emit('message',getConversationMessage?.messages || [])

        // Also update the sidebar to maintain broadcast group
        const conversation = await getConversation(user?._id)
        const broadcastConv = await getBroadcastConversation(user?._id)
        const allConversations = broadcastConv ? [broadcastConv, ...conversation] : conversation
        socket.emit('conversation', allConversations)
    })

    // GROUP CHAT EVENTS
    // Create a group
    socket.on('create-group', async ({ groupName, memberIds }, callback) => {
        try {
            const group = await createGroup({ groupName, creatorId: user._id, memberIds })
            // Join the creator to the group room
            socket.join(group._id.toString())
            // Emit to creator and optionally all members
            io.to(group._id.toString()).emit('group-created', group)
            if (callback) callback({ success: true, group })
        } catch (err) {
            if (callback) callback({ success: false, error: err.message })
        }
    })

    // Send a message to a group
    socket.on('group-message', async ({ groupId, text, imageUrl, videoUrl }, callback) => {
        try {
            const message = await addGroupMessage({ groupId, senderId: user._id, text, imageUrl, videoUrl })
            // Emit to all group members
            io.to(groupId).emit('group-message', { groupId, message })
            if (callback) callback({ success: true, message })
        } catch (err) {
            if (callback) callback({ success: false, error: err.message })
        }
    })

    // Fetch messages for a group
    socket.on('get-group-messages', async (groupId, callback) => {
        try {
            const messages = await getGroupMessages(groupId)
            if (callback) callback({ success: true, messages })
        } catch (err) {
            if (callback) callback({ success: false, error: err.message })
        }
    })

    // Join a group room
    socket.on('join-group', async (groupId) => {
        socket.join(groupId)
    })

    // Leave a group room
    socket.on('leave-group', async (groupId) => {
        socket.leave(groupId)
    })

    // Broadcast page
    socket.on('broadcast-page', async () => {
        // Get all broadcast messages
        const broadcastMessages = await BroadcastModel.find()
            .populate('sender', 'name email profile_pic')
            .sort({ createdAt: 1 })
        socket.emit('broadcast-messages', broadcastMessages)
    })

    // New broadcast message
    socket.on('new-broadcast-message', async (data) => {
        // Create new broadcast message
        const newBroadcastMessage = new BroadcastModel({
            text: data.text,
            imageUrl: data.imageUrl,
            videoUrl: data.videoUrl,
            sender: data.sender
        })
        await newBroadcastMessage.save()

        // Get updated broadcast messages
        const broadcastMessages = await BroadcastModel.find()
            .populate('sender', 'name email profile_pic')
            .sort({ createdAt: 1 })

        // Send to all users except admin
        const allUsers = await UserModel.find({ role: { $ne: 'admin' } })
        for (const user of allUsers) {
            // Send updated broadcast messages
            io.to(user._id.toString()).emit('broadcast-messages', broadcastMessages)

            // Update sidebar for each user
            const conversation = await getConversation(user._id.toString())
            const broadcastConv = await getBroadcastConversation(user._id.toString())
            const allConversations = broadcastConv 
                ? [...conversation, broadcastConv].sort((a, b) => 
                    new Date(b.lastMsg?.createdAt) - new Date(a.lastMsg?.createdAt)
                  )
                : conversation
            io.to(user._id.toString()).emit('conversation', allConversations)
        }
    })

    //new message
    socket.on('new message',async(data)=>{
        //check conversation is available both user
        let conversation = await ConversationModel.findOne({
            "$or" : [
                { sender : data?.sender, receiver : data?.receiver },
                { sender : data?.receiver, receiver :  data?.sender}
            ]
        })

        //if conversation is not available
        if(!conversation){
            const createConversation = await ConversationModel({
                sender : data?.sender,
                receiver : data?.receiver
            })
            conversation = await createConversation.save()
        }
        
        const message = new MessageModel({
          text : data.text,
          imageUrl : data.imageUrl,
          videoUrl : data.videoUrl,
          msgByUserId :  data?.msgByUserId,
        })
        const saveMessage = await message.save()

        const updateConversation = await ConversationModel.updateOne({ _id : conversation?._id },{
            "$push" : { messages : saveMessage?._id }
        })

        const getConversationMessage = await ConversationModel.findOne({
            "$or" : [
                { sender : data?.sender, receiver : data?.receiver },
                { sender : data?.receiver, receiver :  data?.sender}
            ]
        }).populate('messages').sort({ updatedAt : -1 })

        io.to(data?.sender).emit('message',getConversationMessage?.messages || [])
        io.to(data?.receiver).emit('message',getConversationMessage?.messages || [])

        //send conversation with broadcast for both users
        const [senderConversation, receiverConversation] = await Promise.all([
            getConversation(data?.sender),
            getConversation(data?.receiver)
        ]);

        const [senderBroadcast, receiverBroadcast] = await Promise.all([
            getBroadcastConversation(data?.sender),
            getBroadcastConversation(data?.receiver)
        ]);

        // Update sender's conversation list
        const senderAllConversations = senderBroadcast 
            ? [...senderConversation, senderBroadcast].sort((a, b) => 
                new Date(b.lastMsg?.createdAt) - new Date(a.lastMsg?.createdAt)
              )
            : senderConversation;
        io.to(data?.sender).emit('conversation', senderAllConversations);

        // Update receiver's conversation list
        const receiverAllConversations = receiverBroadcast 
            ? [...receiverConversation, receiverBroadcast].sort((a, b) => 
                new Date(b.lastMsg?.createdAt) - new Date(a.lastMsg?.createdAt)
              )
            : receiverConversation;
        io.to(data?.receiver).emit('conversation', receiverAllConversations);
    })

    //sidebar
    socket.on('sidebar',async(currentUserId)=>{
        console.log("current user",currentUserId)

        const conversation = await getConversation(currentUserId)
        const broadcastConv = await getBroadcastConversation(currentUserId)

        // Add broadcast conversation to the list and sort by last message time
        const allConversations = broadcastConv 
            ? [...conversation, broadcastConv].sort((a, b) => 
                new Date(b.lastMsg?.createdAt) - new Date(a.lastMsg?.createdAt)
              )
            : conversation

        socket.emit('conversation', allConversations)
    })

    socket.on('seen',async(msgByUserId)=>{
        let conversation = await ConversationModel.findOne({
            "$or" : [
                { sender : user?._id, receiver : msgByUserId },
                { sender : msgByUserId, receiver :  user?._id}
            ]
        })

        const conversationMessageId = conversation?.messages || []

        const updateMessages  = await MessageModel.updateMany(
            { _id : { "$in" : conversationMessageId }, msgByUserId : msgByUserId },
            { "$set" : { seen : true }}
        )

        //send conversation with broadcast
        const [senderConversation, receiverConversation] = await Promise.all([
            getConversation(user?._id?.toString()),
            getConversation(msgByUserId)
        ]);

        const [senderBroadcast, receiverBroadcast] = await Promise.all([
            getBroadcastConversation(user?._id?.toString()),
            getBroadcastConversation(msgByUserId)
        ]);

        // Update sender's conversation list
        const senderAllConversations = senderBroadcast 
            ? [...senderConversation, senderBroadcast].sort((a, b) => 
                new Date(b.lastMsg?.createdAt) - new Date(a.lastMsg?.createdAt)
              )
            : senderConversation;
        io.to(user?._id?.toString()).emit('conversation', senderAllConversations);

        // Update receiver's conversation list
        const receiverAllConversations = receiverBroadcast 
            ? [...receiverConversation, receiverBroadcast].sort((a, b) => 
                new Date(b.lastMsg?.createdAt) - new Date(a.lastMsg?.createdAt)
              )
            : receiverConversation;
        io.to(msgByUserId).emit('conversation', receiverAllConversations);
    })

    socket.on('disconnect',()=>{
        console.log('disconnect')
        if (user && user._id) {
            onlineUser.delete(user._id.toString())
            io.emit('onlineUser',Array.from(onlineUser))
        }
    })

    socket.on('send-message',async({message,receiverId})=>{
        try {
            //create conversation
            const conversation = await getConversation(user._id,receiverId)
            
            //create message
            const newMessage = new MessageModel({
                conversationId : conversation._id,
                senderId : user._id,
                message
            })
            await newMessage.save()

            const messagePayload = {
                _id : newMessage._id,
                conversationId : newMessage.conversationId,
                senderId : newMessage.senderId,
                message : newMessage.message,
                createdAt : newMessage.createdAt
            }

            io.to(receiverId).emit('receive-message',messagePayload)
            socket.emit('sent-message',messagePayload)
        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('message_error', { message: 'Failed to send message' });
        }
    })
})

module.exports = {
    app,
    server
}
