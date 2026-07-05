import React, { useState, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Chat from './components/Chat';
import Login from './components/Login';

function App() {
   const [user, setUser] = useState(null);
   const [token, setToken] = useState(localStorage.getItem('token'));

   useEffect(() => {
      if (token) {
         fetch('/api/authenticate', {
            method: 'GET',
            headers: {
               'Authorization': `Bearer ${token}`
            }
         })
         .then(response => response.json())
         .then(data => {
            if (data.success) {
               setUser(data.user);
            } else {
               localStorage.removeItem('token');
               setToken(null);
            }
         })
         .catch(error => console.error(error));
      }
   }, [token]);

   const handleLogin = (token, user) => {
      setToken(token);
      setUser(user);
      localStorage.setItem('token', token);
   };

   const handleLogout = () => {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
   };

   return (
      <BrowserRouter>
         <Routes>
            <Route path='/' element={user ? <Chat user={user} handleLogout={handleLogout} /> : <Login handleLogin={handleLogin} />} />
         </Routes>
      </BrowserRouter>
   );
}

export default App;