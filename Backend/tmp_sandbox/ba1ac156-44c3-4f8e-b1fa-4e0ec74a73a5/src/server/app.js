
   const express = require('express');
   const app = express();
   const http = require('http').createServer(app);
   const io = require('socket.io')(http);
   const mongoose = require('mongoose');
   const jwt = require('jsonwebtoken');
   const bcrypt = require('bcryptjs');
   const User = require('./models/User');
   const ChatController = require('./controllers/ChatController');
   const helpers = require('../shared/utils/helpers');
   const constants = require('../shared/constants/constants');

   // Connect to MongoDB
   mongoose.connect(constants.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

   // Middlewares
   app.use(express.json());
   app.use(express.urlencoded({ extended: true }));

   // Socket.io connection
   io.on('connection', (socket) => {
       console.log('Client connected');

       // Handle user authentication
       socket.on('authenticate', (token) => {
           jwt.verify(token, constants.SECRET_KEY, (err, user) => {
               if (err) {
                   socket.emit('authenticationFailed');
               } else {
                   socket.emit('authenticationSuccess', user);
               }
           });
       });

       // Handle new message
       socket.on('newMessage', (message) => {
           const chatController = new ChatController();
           chatController.saveMessage(message, (err, savedMessage) => {
               if (err) {
                   socket.emit('messageSaveError', err);
               } else {
                   io.emit('newMessage', savedMessage);
               }
           });
       });

       // Handle disconnection
       socket.on('disconnect', () => {
           console.log('Client disconnected');
       });
   });

   // Start server
   const port = constants.PORT;
   http.listen(port, () => {
       console.log(`Server started on port ${port}`);
   });
   