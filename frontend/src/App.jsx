import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MapProvider } from './context/MapContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/dashboard/Dashboard';
import MapView from './pages/map/MapView';
import './App.css';

function App() {
  return (
    <MapProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/map" element={<MapView />} />
          </Routes>
        </Layout>
      </Router>
    </MapProvider>
  );
}

export default App;