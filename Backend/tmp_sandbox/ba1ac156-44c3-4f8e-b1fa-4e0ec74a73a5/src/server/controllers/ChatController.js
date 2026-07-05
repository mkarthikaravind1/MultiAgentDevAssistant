
      const mongoose = require('mongoose');
      const User = require('../models/User');
      const Message = require('../models/Message');
      const jwt = require('jsonwebtoken');
      const constants = require('../../shared/constants/constants');

      class ChatController {
         constructor(io) {
            this.io = io;
            this.users = {};
            this.messages = [];

            // Set up WebSocket connection
            io.on('connection', (socket) => {
               console.log('Client connected');

               // Handle user authentication
               socket.on('authenticate', (token) => {
                  jwt.verify(token, constants.SECRET_KEY, (err, decoded) => {
                     if (err) {
                        socket.emit('authenticationError', 'Invalid token');
                     } else {
                        User.findById(decoded.userId, (err, user) => {
                           if (err || !user) {
                              socket.emit('authenticationError', 'User not found');
                           } else {
                              this.users[socket.id] = user;
                              socket.emit('authenticated', user);
                           }
                        });
                     }
                  });
               });

               // Handle message sending
               socket.on('sendMessage', (message) => {
                  const userId = this.users[socket.id]._id;
                  const newMessage = new Message({ text: message, userId });
                  newMessage.save((err) => {
                     if (err) {
                        console.error(err);
                     } else {
                        this.messages.push(newMessage);
                        this.io.emit('newMessage', newMessage);
                     }
                  });
               });

               // Handle disconnection
               socket.on('disconnect', () => {
                  console.log('Client disconnected');
                  delete this.users[socket.id];
               });
            });
         }

         // Get all messages
         getAllMessages(req, res) {
            Message.find().populate('userId').then((messages) => {
               res.json(messages);
            }).catch((err) => {
               console.error(err);
               res.status(500).json({ message: 'Error fetching messages' });
            });
         }

         // Get messages for a specific user
         getUserMessages(req, res) {
            const userId = req.params.userId;
            Message.find({ userId }).populate('userId').then((messages) => {
               res.json(messages);
            }).catch((err) => {
               console.error(err);
               res.status(500).json({ message: 'Error fetching messages' });
            });
         }
      }

      module.exports = ChatController;
   