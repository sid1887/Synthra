import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import Editor from './pages/Editor';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>🧠 Synthra</h1>
          <p className="tagline">The Synthesis Era Begins</p>
        </header>
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/editor/:jobId?" element={<Editor />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
