import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Ensure dark theme is applied at runtime
try {
  document.documentElement.classList.add('dark');
} catch {}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
