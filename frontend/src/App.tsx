import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GameLibrary from './pages/GameLibrary';
import GameUpload from './pages/GameUpload';
import GameDetails from './pages/GameDetails';
import InstallationWizard from './pages/InstallationWizard';
import ItchGames from './components/ItchGames';
import SteamIntegration from './components/SteamIntegration';
import axios from 'axios';
import './config/api'; // Import to set axios defaults
import { API_ENDPOINTS } from './config/api';
import './App.css';

const queryClient = new QueryClient();

function App() {
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkInstallationStatus();
  }, []);

  const checkInstallationStatus = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.INSTALLATION_STATUS);
      setIsInstalled(response.data.installed);
    } catch (error) {
      // If installation endpoint doesn't exist, assume not installed
      setIsInstalled(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="game-library-layout">
        <div className="loading-container">
          <div className="loading-spinner spinner-lg"></div>
          <p className="loading-text">Checking system status...</p>
        </div>
      </div>
    );
  }

  if (isInstalled === false) {
    return (
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="game-library-layout">
            <Routes>
              <Route path="/install" element={<InstallationWizard />} />
              <Route path="*" element={<Navigate to="/install" replace />} />
            </Routes>
          </div>
        </Router>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="game-library-layout">
          <header className="app-header">
            <nav className="app-nav game-navbar">
              <Link to="/" className="app-logo">
                <div className="app-logo-icon">GL</div>
                <span>Game.Lib</span>
              </Link>
              <ul className="app-nav-links">
                <li><Link to="/" className="app-nav-link">Library</Link></li>
                <li><Link to="/upload" className="app-nav-link">Upload</Link></li>
                <li><Link to="/itch" className="app-nav-link">Itch.io</Link></li>
                <li><Link to="/steam" className="app-nav-link">Steam</Link></li>
              </ul>
            </nav>
          </header>
          
          <main className="app-main">
            <Routes>
              <Route path="/" element={<GameLibrary />} />
              <Route path="/upload" element={<GameUpload />} />
              <Route path="/itch" element={<ItchGames />} />
              <Route path="/steam" element={<SteamIntegration />} />
              <Route path="/games/:id" element={<GameDetails />} />
              <Route path="/install" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
