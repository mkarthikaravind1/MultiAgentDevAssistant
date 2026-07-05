
   const assert = require('assert');
   const app = require('../src/server/app');
   const User = require('../src/server/models/User');
   const ChatController = require('../src/server/controllers/ChatController');
   const helpers = require('../src/shared/utils/helpers');
   const constants = require('../src/shared/constants/constants');

   describe('Unit Tests', () => {
       describe('User Model', () => {
           it('should create a new user', async () => {
               const user = new User({ username: 'testUser', password: 'testPassword' });
               await user.save();
               assert.notEqual(user._id, null);
           });

           it('should find a user by username', async () => {
               const user = await User.findOne({ username: 'testUser' });
               assert.notEqual(user, null);
           });
       });

       describe('Chat Controller', () => {
           it('should send a message', async () => {
               const chatController = new ChatController();
               const message = 'Hello, World!';
               const result = await chatController.sendMessage(message);
               assert.equal(result, message);
           });

           it('should get all messages', async () => {
               const chatController = new ChatController();
               const messages = await chatController.getMessages();
               assert.notEqual(messages, null);
           });
       });

       describe('Helpers', () => {
           it('should generate a JWT token', async () => {
               const token = helpers.generateToken('testUser');
               assert.notEqual(token, null);
           });

           it('should verify a JWT token', async () => {
               const token = helpers.generateToken('testUser');
               const result = helpers.verifyToken(token);
               assert.equal(result, 'testUser');
           });
       });

       describe('Constants', () => {
           it('should have the correct constants', async () => {
               assert.equal(constants.PORT, 3000);
               assert.equal(constants.DATABASE_URL, 'mongodb://localhost:27017/chat-app');
           });
       });
   });
   