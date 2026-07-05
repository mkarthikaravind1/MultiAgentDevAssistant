# Deployment Guide
## Introduction
This guide provides step-by-step instructions for deploying the real-time chat application.
## Prerequisites
* Node.js (version 16 or higher) installed on the server
* MongoDB installed and running on the server
* A domain name or IP address for the server
## Deployment Steps
### 1. Set up the Server
* Install Node.js and MongoDB on the server if not already installed
* Create a new user and group for the application
* Set up a reverse proxy using NGINX or Apache
### 2. Configure Environment Variables
* Set the `MONGO_URI` environment variable to the MongoDB connection string
* Set the `JWT_SECRET` environment variable to a secret key for JWT authentication
* Set the `PORT` environment variable to the port number for the application
### 3. Build and Deploy the Frontend
* Run `npm run build` in the `project/frontend` directory to build the React application
* Copy the built files to the server's public directory
### 4. Deploy the Backend
* Run `npm install` in the `project/backend` directory to install dependencies
* Run `npm start` in the `project/backend` directory to start the Express server
### 5. Configure WebSocket Connection
* Set up a WebSocket connection between the client and server using the `wss` protocol
* Configure the WebSocket connection to use the `JWT` token for authentication
## Example Deployment Script
```bash
# Install dependencies
npm install

# Build the frontend
npm run build --prefix frontend

# Start the backend server
npm start

# Set up the reverse proxy
sudo nginx -t
sudo service nginx restart
```
## Troubleshooting
* Check the server logs for errors
* Verify that the MongoDB connection is working correctly
* Test the WebSocket connection using a tool like `wscat`