
      // Import required modules
      const mongoose = require('mongoose');
      const bcrypt = require('bcryptjs');
      const jwt = require('jsonwebtoken');
      const constants = require('../shared/constants/constants');

      // Define the User schema
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
               ref: 'Chat'
            }
         ]
      });

      // Pre-save hook to hash the password
      userSchema.pre('save', async function(next) {
         if (this.isModified('password')) {
            this.password = await bcrypt.hash(this.password, 10);
         }
         next();
      });

      // Method to generate JWT token
      userSchema.methods.generateToken = function() {
         return jwt.sign({ id: this._id }, constants.jwtSecret, { expiresIn: '1h' });
      };

      // Method to compare passwords
      userSchema.methods.comparePassword = async function(password) {
         return await bcrypt.compare(password, this.password);
      };

      // Create the User model
      const User = mongoose.model('User', userSchema);

      // Export the User model
      module.exports = User;
   