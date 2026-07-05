
   // constants.js
   // This file contains all the constants used throughout the application

   export const APP_NAME = 'Real-Time Chat App';
   export const APP_VERSION = '1.0.0';

   // WebSocket Constants
   export const WEBSOCKET_URL = 'ws://localhost:8080';
   export const WEBSOCKET_PORT = 8080;

   // MongoDB Constants
   export const MONGO_URI = 'mongodb://localhost:27017';
   export const MONGO_DB_NAME = 'chat-app';

   // JWT Constants
   export const JWT_SECRET = 'secret-key';
   export const JWT_EXPIRES_IN = '1h';

   // User Constants
   export const USER_ROLES = {
      ADMIN: 'admin',
      USER: 'user'
   };

   // Chat Constants
   export const CHAT_ROOMS = {
      GENERAL: 'general',
      PRIVATE: 'private'
   };

   // Error Constants
   export const ERROR_CODES = {
      INVALID_CREDENTIALS: 401,
      INVALID_REQUEST: 400,
      INTERNAL_SERVER_ERROR: 500
   };

   // Success Constants
   export const SUCCESS_CODES = {
      SUCCESS: 200,
      CREATED: 201
   };
   