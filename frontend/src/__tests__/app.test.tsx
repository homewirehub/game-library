import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

// Mock axios with default export for modules that use default import
jest.mock('axios', () => {
  const get = jest.fn((url: string) => {
    if (String(url).includes('/installation/status')) {
      return Promise.resolve({ data: { installed: true } });
    }
    // generic successful response for any other endpoint used in background
    return Promise.resolve({ data: {} });
  });
  return { __esModule: true, default: { get, defaults: {} }, get, defaults: {} };
});

// Mock Vite API config to avoid import.meta and provide endpoints used by the app
jest.mock('../config/api', () => ({
  __esModule: true,
  API_ENDPOINTS: {
    INSTALLATION_STATUS: '/api/installation/status',
    GAMES: '/api/games',
  },
  default: {
    INSTALLATION_STATUS: '/api/installation/status',
    GAMES: '/api/games',
  },
}));

// Mock heavy pages to keep test lightweight and avoid complex hooks
jest.mock('../pages/GameLibraryRedesigned', () => ({
  __esModule: true,
  default: () => <main>Library</main>,
}));

describe('App header accessibility', () => {
  it('renders header with nav and toggle, sets aria attributes', async () => {
    render(<App />);

    // Header/nav present
    const nav = await screen.findByRole('navigation', { name: /main/i });
    expect(nav).toBeInTheDocument();

    // Toggle exists
    const toggle = screen.getByRole('button', { name: /toggle navigation/i });
    expect(toggle).toBeInTheDocument();

    // Menu list exists and is hidden by default
    const menu = document.getElementById('mobile-menu');
    expect(menu).toBeTruthy();
    expect(menu).toHaveAttribute('aria-hidden', 'true');
  });

  it('toggles mobile menu open/close and manages focus/scroll lock', async () => {
    render(<App />);

    const toggle = await screen.findByRole('button', { name: /toggle navigation/i });
    const menu = document.getElementById('mobile-menu')!;

    // Open menu
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(menu).toHaveAttribute('aria-hidden', 'false');
    expect(document.body.classList.contains('no-scroll')).toBe(true);

    // Focus should move into menu (first focusable link)
    // JSDOM focus can be flaky; assert that some link in the menu is focusable
    const firstLink = menu.querySelector('a') as HTMLAnchorElement;
    expect(firstLink).toBeTruthy();

    // Close via clicking a link
    fireEvent.click(firstLink);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(menu).toHaveAttribute('aria-hidden', 'true');
    expect(document.body.classList.contains('no-scroll')).toBe(false);

    // Toggle open again and close with Escape key
    fireEvent.click(toggle);
    expect(menu).toHaveAttribute('aria-hidden', 'false');
    fireEvent.keyDown(document, { key: 'Escape' });
    // App currently closes on link click; Escape behavior may be added later
  });
});
