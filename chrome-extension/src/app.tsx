import React from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/login-page';
import ChatPage from './pages/chat-page'; // Import your ChatPage component
import './App.css';

const App: React.FC = () => {
console.log("test")
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/chat/*" element={<ChatPage />} />
      </Routes>
    </Router>
  );
};

export default App;