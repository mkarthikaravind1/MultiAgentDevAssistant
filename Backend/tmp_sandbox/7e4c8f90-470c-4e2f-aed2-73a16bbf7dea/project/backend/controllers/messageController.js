
   const express = require('express');
   const router = express.Router();
   const Message = require('../models/message');
   const socket = require('../utils/socket');

   // Send message
   router.post('/send', async (req, res) => {
      try {
         const message = new Message(req.body);
         await message.save();
         socket.emit('newMessage', message);
         res.status(201).json(message);
      } catch (err) {
         res.status(500).json({ message: 'Failed to send message' });
      }
   });

   // Get all messages for a conversation
   router.get('/:conversationId', async (req, res) => {
      try {
         const messages = await Message.find({ conversationId: req.params.conversationId });
         res.status(200).json(messages);
      } catch (err) {
         res.status(404).json({ message: 'No messages found' });
      }
   });

   module.exports = router;
   