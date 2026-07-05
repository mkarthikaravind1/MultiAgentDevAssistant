const request = require('supertest');
const app = require('../../backend/app');
const User = require('../../backend/models/user');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

beforeAll(async () => {
    await mongoose.connect('mongodb://localhost/test', { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('User Test', () => {
    it('should create a new user', async () => {
        const response = await request(app).post('/api/users').send({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password'
        });
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('name', 'Test User');
        expect(response.body).toHaveProperty('email', 'test@example.com');
    });

    it('should login a user', async () => {
        const response = await request(app).post('/api/users/login').send({
            email: 'test@example.com',
            password: 'password'
        });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        const token = response.body.token;
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        expect(decoded).toHaveProperty('email', 'test@example.com');
    });

    it('should get a user by id', async () => {
        const user = await User.findOne({ email: 'test@example.com' });
        const response = await request(app).get(`/api/users/${user._id}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('name', 'Test User');
        expect(response.body).toHaveProperty('email', 'test@example.com');
    });

    it('should update a user', async () => {
        const user = await User.findOne({ email: 'test@example.com' });
        const response = await request(app).patch(`/api/users/${user._id}`).send({
            name: 'Updated Test User'
        });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('name', 'Updated Test User');
    });

    it('should delete a user', async () => {
        const user = await User.findOne({ email: 'test@example.com' });
        const response = await request(app).delete(`/api/users/${user._id}`);
        expect(response.status).toBe(204);
    });
});