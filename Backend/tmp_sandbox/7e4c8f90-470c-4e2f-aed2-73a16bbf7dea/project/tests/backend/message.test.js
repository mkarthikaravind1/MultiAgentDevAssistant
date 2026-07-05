
   const request = require('supertest');
   const app = require('../../app');
   const Message = require('../../models/message');
   const User = require('../../models/user');
   const mongoose = require('mongoose');
   const jwt = require('jsonwebtoken');

   describe('Message API', () => {
       let server;
       let token;

       beforeAll(async () => {
           await mongoose.connect('mongodb://localhost/test', { useNewUrlParser: true, useUnifiedTopology: true });
           server = app.listen(3001);
           const user = new User({ name: 'Test User', email: 'test@example.com', password: 'password' });
           await user.save();
           token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1h' });
       });

       afterAll(async () => {
           await mongoose.connection.close();
           server.close();
       });

       it('should send a message', async () => {
           const response = await request(app)
               .post('/api/messages')
               .set('Authorization', `Bearer ${token}`)
               .send({ text: 'Hello, world!' });
           expect(response.status).toBe(201);
           expect(response.body.text).toBe('Hello, world!');
       });

       it('should get all messages', async () => {
           const response = await request(app)
               .get('/api/messages')
               .set('Authorization', `Bearer ${token}`);
           expect(response.status).toBe(200);
           expect(response.body).toBeInstanceOf(Array);
       });

       it('should get a message by id', async () => {
           const message = new Message({ text: 'Hello, world!' });
           await message.save();
           const response = await request(app)
               .get(`/api/messages/${message._id}`)
               .set('Authorization', `Bearer ${token}`);
           expect(response.status).toBe(200);
           expect(response.body.text).toBe('Hello, world!');
       });

       it('should update a message', async () => {
           const message = new Message({ text: 'Hello, world!' });
           await message.save();
           const response = await request(app)
               .put(`/api/messages/${message._id}`)
               .set('Authorization', `Bearer ${token}`)
               .send({ text: 'Hello, universe!' });
           expect(response.status).toBe(200);
           expect(response.body.text).toBe('Hello, universe!');
       });

       it('should delete a message', async () => {
           const message = new Message({ text: 'Hello, world!' });
           await message.save();
           const response = await request(app)
               .delete(`/api/messages/${message._id}`)
               .set('Authorization', `Bearer ${token}`);
           expect(response.status).toBe(204);
       });
   });
   