
      const express = require('express');
      const app = express();
      const mongoose = require('mongoose');
      const jwt = require('jsonwebtoken');
      const socket = require('./utils/socket');
      const userController = require('./controllers/userController');
      const messageController = require('./controllers/messageController');
      const User = require('./models/user');
      const Message = require('./models/message');

      // Connect to MongoDB
      mongoose.connect('mongodb://localhost:27017/chat-app', { useNewUrlParser: true, useUnifiedTopology: true });

      // Middleware
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));

      // Socket connection
      const server = require('http').createServer(app);
      const io = require('socket.io')(server);

      // Authenticate user on socket connection
      io.use(async (socket, next) => {
         try {
            const token = socket.handshake.auth.token;
            const decoded = jwt.verify(token, 'secret-key');
            socket.userId = decoded.userId;
            next();
         } catch (error) {
            next(new Error('Authentication failed'));
         }
      });

      // Handle socket connections
      io.on('connection', (socket) => {
         console.log('User connected');

         // Handle disconnection
         socket.on('disconnect', () => {
            console.log('User disconnected');
         });

         // Handle new message
         socket.on('newMessage', async (message) => {
            try {
               const newMessage = await messageController.createMessage(message, socket.userId);
               io.emit('newMessage', newMessage);
            } catch (error) {
               console.error(error);
            }
         });

         // Handle get messages
         socket.on('getMessages', async () => {
            try {
               const messages = await messageController.getMessages();
               socket.emit('getMessages', messages);
            } catch (error) {
               console.error(error);
            }
         });
      });

      // User routes
      app.post('/register', userController.registerUser);
      app.post('/login', userController.loginUser);

      // Message routes
      app.get('/messages', messageController.getMessages);
      app.post('/messages', messageController.createMessage);

      // Start server
      const port = 3001;
      server.listen(port, () => {
         console.log(`Server started on port ${port}`);
      });
   