import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock Vite API config to avoid import.meta in tests
jest.mock('../config/api', () => ({
  __esModule: true,
  API_ENDPOINTS: {
    INSTALLATION_STATUS: '/api/installation/status',
  },
  default: {
    INSTALLATION_STATUS: '/api/installation/status',
  },
}));

// Mock heavy route components to keep test focused on header/nav
jest.mock('../pages/GameLibraryRedesigned', () => ({
  __esModule: true,
  default: () => <div>Library New</div>,
}));
jest.mock('../pages/GameUpload', () => ({ __esModule: true, default: () => <div>Upload</div> }));
jest.mock('../pages/GameDetails', () => ({ __esModule: true, default: () => <div>Details</div> }));
jest.mock('../pages/InstallationWizard', () => ({
  __esModule: true,
  default: () => <div>Install</div>,
}));
jest.mock('../components/ItchGames', () => ({ __esModule: true, default: () => <div>Itch</div> }));
jest.mock('../components/DesignSystemDemo', () => ({
  __esModule: true,
  default: () => <div>Design</div>,
}));
jest.mock('../components/SteamIntegration', () => ({
  __esModule: true,
  default: () => <div>Steam</div>,
}));

describe('App navigation a11y', () => {
  beforeEach(() => {
    mockedAxios.get = jest.fn().mockResolvedValue({ data: { installed: true } });
  });

  it('toggles mobile menu and manages aria + focus', async () => {
    const { default: App } = await import('../App');
    render(<App />);

    const toggle = await screen.findByRole('button', { name: /toggle navigation/i });

    // Initially closed
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const menu = screen.getByRole('menu', { hidden: true });
    expect(menu).toHaveAttribute('aria-hidden', 'true');

    // Open
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(menu).toHaveAttribute('aria-hidden', 'false');

    // Escape closes
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(menu).toHaveAttribute('aria-hidden', 'true');
    expect(toggle).toHaveFocus();
  });
});
