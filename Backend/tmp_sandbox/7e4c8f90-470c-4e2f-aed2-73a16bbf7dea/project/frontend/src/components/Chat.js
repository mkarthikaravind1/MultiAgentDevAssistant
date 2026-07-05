
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Chat = () => {
   const [messages, setMessages] = useState([]);
   const [newMessage, setNewMessage] = useState('');
   const [username, setUsername] = useState('');

   useEffect(() => {
      const storedUsername = localStorage.getItem('username');
      if (storedUsername) {
         setUsername(storedUsername);
      }
   }, []);

   const handleSendMessage = async () => {
      if (newMessage.trim() !== '') {
         try {
            const response = await axios.post('/api/messages', {
               message: newMessage,
               username: username,
            });
            setMessages((prevMessages) => [...prevMessages, response.data]);
            setNewMessage('');
         } catch (error) {
            console.error(error);
         }
      }
   };

   const handleKeyPress = (event) => {
      if (event.key === 'Enter') {
         handleSendMessage();
      }
   };

   const handleNewMessageChange = (event) => {
      setNewMessage(event.target.value);
   };

   useEffect(() => {
      const socket = new WebSocket('ws://localhost:8080');

      socket.onmessage = (event) => {
         setMessages((prevMessages) => [...prevMessages, JSON.parse(event.data)]);
      };

      socket.onopen = () => {
         console.log('Connected to the WebSocket server');
      };

      socket.onclose = () => {
         console.log('Disconnected from the WebSocket server');
      };

      socket.onerror = (error) => {
         console.error('Error occurred:', error);
      };

      return () => {
         socket.close();
      };
   }, []);

   return (
      <div className='chat-container'>
         <h2>Chat</h2>
         <ul className='message-list'>
            {messages.map((message, index) => (
               <li key={index}>
                  <span className='username'>{message.username}:</span>
                  <span className='message'>{message.message}</span>
               </li>
            ))}
         </ul>
         <input
            type='text'
            value={newMessage}
            onChange={handleNewMessageChange}
            onKeyPress={handleKeyPress}
            placeholder='Type a message...'
         />
         <button onClick={handleSendMessage}>Send</button>
      </div>
   );
};

export default Chat;
