const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const db = require('./models/db_access.js');
const cors = require('cors');

const app = express();
app.use(cors({
    origin: '*',
    methods: ['POST', 'DELETE', 'PUT', 'GET', 'OPTIONS', 'HEAD'],
    credentials: true
  }));

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['POST', 'DELETE', 'PUT', 'GET', 'OPTIONS', 'HEAD'],
        credentials: true
    },
});

// Socket.IO evenf hadling

io.on('connection', (socket) => {
    console.log('New client connected');

    // handle joining chat.
    socket.on('getGroupChats', async (data) => {
        const userId = data.username;
        const groupChats = await db.send_sql(
            `SELECT * FROM group_chats WHERE FIND_IN_SET('${userId}', members)`
        );
        socket.emit('groupChatsList', groupChats);
    });

    // Handle joining a chat room
    socket.on('joinChat', async (data) => {
        const { username, chatId } = data;
        socket.join(chatId);

        // Retrieve chat history from the database
        const chatHistory = await db.send_sql(
            `SELECT * FROM messages WHERE group_id = '${chatId}' ORDER BY timestamp ASC`
        );
        socket.emit('chatHistory', chatHistory);
    });

    // Handle sending a message
    socket.on('sendMessage', async (data) => {
        const { username, chatId, message } = data;
        // Insert the message into the database
        await db.send_sql(
            `INSERT INTO messages (message, \`from\`, \`to\`, group_id) VALUES ('${message}', '${username}', '${username}', '${chatId}')`
        );
    
        // Broadcast the message to all clients in the chat room
        io.to(chatId).emit('newMessage', {
          message,
          from: username,
          timestamp: new Date(),
        });
    });

    // Handle leaving a chat room
    socket.on('leaveChat', async (data) => {
        const { username, chatId } = data;
        socket.leave(chatId);

        const groupChat = await db.send_sql(
            `SELECT * FROM group_chats WHERE group_id = '${chatId}'`
        )

        const members = groupChat[0].members.split(',');
        for (let i = 0; i < members.length; i++) {
            members[i] = ',' + members[i];
        }
        members.shift();

        const newMembers = members.filter((member) => member !== ("," + username));

        const newMembersString = newMembers.join('');

        await db.send_sql(
            `UPDATE group_chats SET members = '${newMembersString}' WHERE group_id = '${chatId}'`
        );
    });

    socket.on('inviteUser', async (data) => {
        const { username, chatId, invitedUser } = data;
        // add to notification where username is notifier and invitedUser is notified
        // notifier should be username:chatId
        await db.send_sql(
            `INSERT INTO notifications (notified, notifier) VALUES ('${invitedUser}', '${username}:${chatId}')`
        );
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});


// start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`ChatServer running on port ${PORT}`);
});