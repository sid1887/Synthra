import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Editor from './pages/Editor';
import { SVEStudio } from './pages/SVEStudio';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor/:roomId?" element={<Editor />} />
        <Route path="/room/:roomId" element={<Editor />} />
        <Route path="/admin/sve" element={<SVEStudio />} />
      </Routes>
    </Router>
  );
}

export default App;
