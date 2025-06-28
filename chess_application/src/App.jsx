import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SessionPage from './pages/SessionPage';
import GamePage from './pages/GamePage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<SessionPage />} />
          <Route path="/game/:sessionId" element={<GamePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
