
   const request = require('supertest');
   const app = require('../../src/server/app');
   const User = require('../../src/server/models/User');
   const ChatController = require('../../src/server/controllers/ChatController');
   const mongoose = require('mongoose');
   const jwt = require('jsonwebtoken');

   // Connect to MongoDB
   beforeAll(async () => {
      await mongoose.connect('mongodb://localhost:27017/test', { useNewUrlParser: true, useUnifiedTopology: true });
   });

   // Clear database before each test
   beforeEach(async () => {
      await User.deleteMany({});
   });

   // Close database connection after all tests
   afterAll(async () => {
      await mongoose.connection.close();
   });

   describe('POST /register', () => {
      it('should register a new user', async () => {
         const response = await request(app).post('/register').send({ username: 'testuser', password: 'testpassword' });
         expect(response.status).toBe(201);
         expect(response.body.token).not.toBeNull();
      });

      it('should not register a user with an existing username', async () => {
         await request(app).post('/register').send({ username: 'testuser', password: 'testpassword' });
         const response = await request(app).post('/register').send({ username: 'testuser', password: 'testpassword' });
         expect(response.status).toBe(400);
      });
   });

   describe('POST /login', () => {
      it('should login an existing user', async () => {
         await request(app).post('/register').send({ username: 'testuser', password: 'testpassword' });
         const response = await request(app).post('/login').send({ username: 'testuser', password: 'testpassword' });
         expect(response.status).toBe(200);
         expect(response.body.token).not.toBeNull();
      });

      it('should not login a non-existent user', async () => {
         const response = await request(app).post('/login').send({ username: 'nonexistentuser', password: 'testpassword' });
         expect(response.status).toBe(401);
      });
   });

   describe('GET /chat', () => {
      it('should get chat messages for an authenticated user', async () => {
         await request(app).post('/register').send({ username: 'testuser', password: 'testpassword' });
         const loginResponse = await request(app).post('/login').send({ username: 'testuser', password: 'testpassword' });
         const token = loginResponse.body.token;
         const response = await request(app).get('/chat').set('Authorization', `Bearer ${token}`);
         expect(response.status).toBe(200);
         expect(response.body.messages).not.toBeNull();
      });

      it('should not get chat messages for an unauthenticated user', async () => {
         const response = await request(app).get('/chat');
         expect(response.status).toBe(401);
      });
   });

   describe('POST /chat', () => {
      it('should send a new chat message for an authenticated user', async () => {
         await request(app).post('/register').send({ username: 'testuser', password: 'testpassword' });
         const loginResponse = await request(app).post('/login').send({ username: 'testuser', password: 'testpassword' });
         const token = loginResponse.body.token;
         const response = await request(app).post('/chat').set('Authorization', `Bearer ${token}`).send({ message: 'Hello, world!' });
         expect(response.status).toBe(201);
         expect(response.body.message).not.toBeNull();
      });

      it('should not send a new chat message for an unauthenticated user', async () => {
         const response = await request(app).post('/chat').send({ message: 'Hello, world!' });
         expect(response.status).toBe(401);
      });
   });
   