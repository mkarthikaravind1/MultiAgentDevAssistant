const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { MONGO_URI } = require('../constants/constants');
const mongoose = require('mongoose');

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const generateToken = (user) => {
  return jwt.sign({ id: user._id, username: user.username }, process.env.SECRET_KEY, { expiresIn: '1h' });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.SECRET_KEY);
  } catch (error) {
    return null;
  }
};

const hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

const comparePasswords = (password, hashedPassword) => {
  return bcrypt.compareSync(password, hashedPassword);
};

module.exports = { generateToken, verifyToken, hashPassword, comparePasswords };