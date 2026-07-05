
   // Import required libraries
   import WebSocket from 'ws';
   import { useState, useEffect } from 'react';
   import { render } from 'react-dom';
   import { BrowserRouter, Route, Routes } from 'react-router-dom';
   import axios from 'axios';

   // Set up WebSocket connection
   const ws = new WebSocket('ws://localhost:8080');

   // Set up state for chat messages and user
   const [messages, setMessages] = useState([]);
   const [user, setUser] = useState(null);

   // Handle WebSocket connection establishment
   ws.onopen = () => {
      console.log('Connected to the WebSocket server');
   };

   // Handle incoming messages
   ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prevMessages) => [...prevMessages, message]);
   };

   // Handle errors
   ws.onerror = (event) => {
      console.log('Error occurred:', event);
   };

   // Handle disconnection
   ws.onclose = () => {
      console.log('Disconnected from the WebSocket server');
   };

   // Function to send message
   const sendMessage = (message) => {
      ws.send(JSON.stringify(message));
   };

   // Function to handle user authentication
   const authenticateUser = async (username, password) => {
      try {
         const response = await axios.post('http://localhost:8080/authenticate', { username, password });
         const token = response.data.token;
         localStorage.setItem('token', token);
         setUser({ username, token });
      } catch (error) {
         console.log('Error authenticating user:', error);
      }
   };

   // Function to handle user registration
   const registerUser = async (username, password) => {
      try {
         const response = await axios.post('http://localhost:8080/register', { username, password });
         const token = response.data.token;
         localStorage.setItem('token', token);
         setUser({ username, token });
      } catch (error) {
         console.log('Error registering user:', error);
      }
   };

   // Render the chat interface
   const ChatInterface = () => {
      const [newMessage, setNewMessage] = useState('');

      const handleSendMessage = () => {
         if (newMessage.trim() !== '') {
            sendMessage({ message: newMessage, user: user.username });
            setNewMessage('');
         }
      };

      return (
         <div>
            <h1>Chat Interface</h1>
            <ul>
               {messages.map((message, index) => (
                  <li key={index}>
                     <b>{message.user}:</b> {message.message}
                  </li>
               ))}
            </ul>
            <input
               type='text'
               value={newMessage}
               onChange={(event) => setNewMessage(event.target.value)}
               placeholder='Type a message'
            />
            <button onClick={handleSendMessage}>Send</button>
         </div>
      );
   };

   // Render the login interface
   const LoginInterface = () => {
      const [username, setUsername] = useState('');
      const [password, setPassword] = useState('');

      const handleLogin = () => {
         authenticateUser(username, password);
      };

      return (
         <div>
            <h1>Login Interface</h1>
            <input
               type='text'
               value={username}
               onChange={(event) => setUsername(event.target.value)}
               placeholder='Username'
            />
            <input
               type='password'
               value={password}
               onChange={(event) => setPassword(event.target.value)}
               placeholder='Password'
            />
            <button onClick={handleLogin}>Login</button>
         </div>
      );
   };

   // Render the registration interface
   const RegisterInterface = () => {
      const [username, setUsername] = useState('');
      const [password, setPassword] = useState('');

      const handleRegister = () => {
         registerUser(username, password);
      };

      return (
         <div>
            <h1>Registration Interface</h1>
            <input
               type='text'
               value={username}
               onChange={(event) => setUsername(event.target.value)}
               placeholder='Username'
            />
            <input
               type='password'
               value={password}
               onChange={(event) => setPassword(event.target.value)}
               placeholder='Password'
            />
            <button onClick={handleRegister}>Register</button>
         </div>
      );
   };

   // Render the main application
   const App = () => {
      if (user) {
         return <ChatInterface />;
      } else {
         return (
            <div>
               <LoginInterface />
               <RegisterInterface />
            </div>
         );
      }
   };

   render(
      <BrowserRouter>
         <Routes>
            <Route path='/' element={<App />} />
         </Routes>
      </BrowserRouter>,
      document.getElementById('root')
   );
   