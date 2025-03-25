import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LobbyScreen from './screens/Lobby';
import RoomScreen from './screens/Room';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<LobbyScreen />} />
          <Route path="/room/:roomId" element={<RoomScreen />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;