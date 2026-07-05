
   const mongoose = require('mongoose');
   const bcrypt = require('bcryptjs');
   const jwt = require('jsonwebtoken');

   const userSchema = new mongoose.Schema({
      name: {
         type: String,
         required: true
      },
      email: {
         type: String,
         required: true,
         unique: true
      },
      password: {
         type: String,
         required: true
      },
      chats: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message'
         }
      ]
   });

   userSchema.pre('save', async function(next) {
      if (this.isModified('password')) {
         this.password = await bcrypt.hash(this.password, 10);
      }
      next();
   });

   userSchema.methods.generateAuthToken = async function() {
      const user = this;
      const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, {
         expiresIn: '1 day'
      });
      return token;
   };

   userSchema.statics.findByCredentials = async (email, password) => {
      const user = await User.findOne({ email });
      if (!user) {
         throw new Error('Unable to login');
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
         throw new Error('Unable to login');
      }
      return user;
   };

   const User = mongoose.model('User', userSchema);

   module.exports = User;
   