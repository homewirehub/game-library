import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GameLibrary from './pages/GameLibrary';
import GameLibraryRedesigned from './pages/GameLibraryRedesigned';
import GameUpload from './pages/GameUpload';
import GameDetails from './pages/GameDetails';
import InstallationWizard from './pages/InstallationWizard';
import ItchGames from './components/ItchGames';
import ItchGamesRedesigned from './components/ItchGamesRedesigned';
import DesignSystemDemo from './components/DesignSystemDemo';
import SteamIntegration from './components/SteamIntegration';
import axios from 'axios';
import './config/api'; // Import to set axios defaults
import { API_ENDPOINTS } from './config/api';
import './App.css';

const queryClient = new QueryClient();

function App() {
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
            <nav className="app-nav game-navbar" aria-label="Main">
              <Link to="/" className="app-logo">
                <div className="app-logo-icon">GL</div>
                <span>Game.Lib</span>
              </Link>
              <button
                id="nav-toggle"
                className="navbar-toggle"
                aria-controls="mobile-menu"
                aria-expanded={isMenuOpen}
                onClick={() => {
                  const next = !isMenuOpen;
                  setIsMenuOpen(next);
                  document.body.classList.toggle('no-scroll', next);
                }}
              >
                <span className="sr-only">Toggle navigation</span>
                ☰
              </button>
              <ul
                id="mobile-menu"
                className={isMenuOpen ? 'app-nav-links navbar-menu mobile-open' : 'app-nav-links navbar-menu'}
                aria-hidden={!isMenuOpen}
              >
                <li>
                  <NavLink
                    to="/"
                    className={({ isActive }) => (isActive ? 'app-nav-link active' : 'app-nav-link')}
                    onClick={() => { if (isMenuOpen) { setIsMenuOpen(false); document.body.classList.remove('no-scroll'); } }}
                  >
                    Library
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/library-redesigned"
                    className={({ isActive }) => (isActive ? 'app-nav-link active' : 'app-nav-link')}
                    onClick={() => { if (isMenuOpen) { setIsMenuOpen(false); document.body.classList.remove('no-scroll'); } }}
                  >
                    Library (New)
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/upload"
                    className={({ isActive }) => (isActive ? 'app-nav-link active' : 'app-nav-link')}
                    onClick={() => { if (isMenuOpen) { setIsMenuOpen(false); document.body.classList.remove('no-scroll'); } }}
                  >
                    Upload
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/itch"
                    className={({ isActive }) => (isActive ? 'app-nav-link active' : 'app-nav-link')}
                    onClick={() => { if (isMenuOpen) { setIsMenuOpen(false); document.body.classList.remove('no-scroll'); } }}
                  >
                    Itch.io
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/itch-redesigned"
                    className={({ isActive }) => (isActive ? 'app-nav-link active' : 'app-nav-link')}
                    onClick={() => { if (isMenuOpen) { setIsMenuOpen(false); document.body.classList.remove('no-scroll'); } }}
                  >
                    Itch (New)
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/design-system"
                    className={({ isActive }) => (isActive ? 'app-nav-link active' : 'app-nav-link')}
                    onClick={() => { if (isMenuOpen) { setIsMenuOpen(false); document.body.classList.remove('no-scroll'); } }}
                  >
                    🎨 Design
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/steam"
                    className={({ isActive }) => (isActive ? 'app-nav-link active' : 'app-nav-link')}
                    onClick={() => { if (isMenuOpen) { setIsMenuOpen(false); document.body.classList.remove('no-scroll'); } }}
                  >
                    Steam
                  </NavLink>
                </li>
              </ul>
            </nav>
          </header>
          
          <main className="app-main">
            <Routes>
              <Route path="/" element={<GameLibrary />} />
              <Route path="/library-redesigned" element={<GameLibraryRedesigned />} />
              <Route path="/upload" element={<GameUpload />} />
              <Route path="/itch" element={<ItchGames />} />
              <Route path="/itch-redesigned" element={<ItchGamesRedesigned />} />
              <Route path="/design-system" element={<DesignSystemDemo />} />
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
