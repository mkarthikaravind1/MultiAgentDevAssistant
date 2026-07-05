
   const mongoose = require('mongoose');
   const Schema = mongoose.Schema;

   const messageSchema = new Schema({
      text: {
         type: String,
         required: true
      },
      sender: {
         type: Schema.Types.ObjectId,
         ref: 'User',
         required: true
      },
      receiver: {
         type: Schema.Types.ObjectId,
         ref: 'User',
         required: true
      },
      createdAt: {
         type: Date,
         default: Date.now
      }
   });

   const Message = mongoose.model('Message', messageSchema);

   module.exports = Message;
   