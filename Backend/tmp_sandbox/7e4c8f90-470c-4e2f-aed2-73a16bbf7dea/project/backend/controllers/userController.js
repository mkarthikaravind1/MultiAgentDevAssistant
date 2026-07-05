
   const express = require('express');
   const router = express.Router();
   const User = require('../models/user');
   const jwt = require('jsonwebtoken');
   const bcrypt = require('bcryptjs');

   // Register a new user
   router.post('/register', async (req, res) => {
       try {
           const { name, email, password } = req.body;
           const existingUser = await User.findOne({ email });
           if (existingUser) {
               return res.status(400).json({ message: 'User already exists' });
           }
           const hashedPassword = await bcrypt.hash(password, 10);
           const user = new User({ name, email, password: hashedPassword });
           await user.save();
           res.status(201).json({ message: 'User created successfully' });
       } catch (error) {
           res.status(500).json({ message: 'Error creating user' });
       }
   });

   // Login a user
   router.post('/login', async (req, res) => {
       try {
           const { email, password } = req.body;
           const user = await User.findOne({ email });
           if (!user) {
               return res.status(401).json({ message: 'Invalid email or password' });
           }
           const isValidPassword = await bcrypt.compare(password, user.password);
           if (!isValidPassword) {
               return res.status(401).json({ message: 'Invalid email or password' });
           }
           const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1h' });
           res.status(200).json({ token });
       } catch (error) {
           res.status(500).json({ message: 'Error logging in user' });
       }
   });

   // Get the current user
   router.get('/me', authenticate, async (req, res) => {
       try {
           const user = await User.findById(req.user.userId);
           res.status(200).json(user);
       } catch (error) {
           res.status(500).json({ message: 'Error getting user' });
       }
   });

   // Middleware to authenticate requests
   function authenticate(req, res, next) {
       const token = req.header('Authorization');
       if (!token) {
           return res.status(401).json({ message: 'Access denied. No token provided.' });
       }
       try {
           const decoded = jwt.verify(token, process.env.SECRET_KEY);
           req.user = decoded;
           next();
       } catch (ex) {
           return res.status(400).json({ message: 'Invalid token.' });
       }
   }

   module.exports = router;
   