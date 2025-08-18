import React, { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const GameLibraryRedesigned = lazy(() => import('./pages/GameLibraryRedesigned'));
const GameUpload = lazy(() => import('./pages/GameUpload'));
const GameDetails = lazy(() => import('./pages/GameDetails'));
const InstallationWizard = lazy(() => import('./pages/InstallationWizard'));
const ItchGames = lazy(() => import('./components/ItchGames'));
const DesignSystemDemo = lazy(() => import('./components/DesignSystemDemo'));
const SteamIntegration = lazy(() => import('./components/SteamIntegration'));
import ErrorBoundary from './components/ErrorBoundary';
import axios from 'axios';
import './config/api'; // sets axios defaults
import { API_ENDPOINTS } from './config/api';
import './App.css';

const queryClient = new QueryClient();

function App() {
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLUListElement | null>(null);

  const openMenu = () => {
    setIsMenuOpen(true);
    document.body.classList.add('no-scroll');
    // focus first focusable element inside menu
    setTimeout(() => {
      const first = menuRef.current?.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      first?.focus();
    }, 0);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    document.body.classList.remove('no-scroll');
    toggleRef.current?.focus();
  };

  // Keyboard handling only when menu is open
  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!menuRef.current) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu();
        return;
      }
      if (e.key === 'Tab') {
        const focusables = Array.from(
          menuRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter(el => !el.hasAttribute('disabled') && el.tabIndex !== -1 && !el.getAttribute('aria-hidden'));
        if (focusables.length === 0) {
          e.preventDefault();
          toggleRef.current?.focus();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (!active || !menuRef.current.contains(active)) {
          first.focus();
          e.preventDefault();
          return;
        }
        if (!e.shiftKey && active === last) {
          first.focus();
          e.preventDefault();
        } else if (e.shiftKey && active === first) {
          last.focus();
          e.preventDefault();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isMenuOpen]);

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
  <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ErrorBoundary>
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
                ref={toggleRef}
                onClick={() => (isMenuOpen ? closeMenu() : openMenu())}
              >
                <span className="sr-only">Toggle navigation</span>
                ☰
              </button>
              <ul
                id="mobile-menu"
                ref={menuRef}
                className={isMenuOpen ? 'app-nav-links navbar-menu mobile-open' : 'app-nav-links navbar-menu'}
                aria-hidden={!isMenuOpen}
                role="menu"
                aria-labelledby="nav-toggle"
              >
                <li>
                  <NavLink
                    to="/"
                    className={({ isActive }) => (isActive ? 'app-nav-link active' : 'app-nav-link')}
                    onClick={() => { if (isMenuOpen) closeMenu(); }}
                  >
                    Library
                  </NavLink>
                </li>
                
                <li>
                  <NavLink
                    to="/upload"
                    className={({ isActive }) => (isActive ? 'app-nav-link active' : 'app-nav-link')}
                    onClick={() => { if (isMenuOpen) closeMenu(); }}
                  >
                    Upload
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/itch"
                    className={({ isActive }) => (isActive ? 'app-nav-link active' : 'app-nav-link')}
                    onClick={() => { if (isMenuOpen) closeMenu(); }}
                  >
                    Itch.io
                  </NavLink>
                </li>
                
                <li>
                  <NavLink
                    to="/design-system"
                    className={({ isActive }) => (isActive ? 'app-nav-link active' : 'app-nav-link')}
                    onClick={() => { if (isMenuOpen) closeMenu(); }}
                  >
                    🎨 Design
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/steam"
                    className={({ isActive }) => (isActive ? 'app-nav-link active' : 'app-nav-link')}
                    onClick={() => { if (isMenuOpen) closeMenu(); }}
                  >
                    Steam
                  </NavLink>
                </li>
              </ul>
            </nav>
          </header>

          <main className="app-main">
            <Suspense fallback={<div className="loading-container"><div className="loading-spinner spinner-lg"></div></div>}>
            <Routes>
              <Route path="/" element={<GameLibraryRedesigned />} />
              <Route path="/library" element={<Navigate to="/" replace />} />
              <Route path="/upload" element={<GameUpload />} />
              <Route path="/itch" element={<ItchGames />} />
              <Route path="/itch-redesigned" element={<Navigate to="/itch" replace />} />
              <Route path="/design-system" element={<DesignSystemDemo />} />
              <Route path="/steam" element={<SteamIntegration />} />
              <Route path="/games/:id" element={<GameDetails />} />
              <Route path="/install" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense>
          </main>
        </div>
        </ErrorBoundary>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
