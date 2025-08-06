// API Configuration
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;

export const API_ENDPOINTS = {
  // Installation endpoints
  INSTALLATION_STATUS: `${API_BASE_URL}/api/installation/status`,
  INSTALLATION_REQUIREMENTS: `${API_BASE_URL}/api/installation/requirements`,
  INSTALLATION_TEST_DB: `${API_BASE_URL}/api/installation/test-database`,
  INSTALLATION_INSTALL: `${API_BASE_URL}/api/installation/install`,
  
  // Game endpoints
  GAMES: `${API_BASE_URL}/games`,
  GAMES_UPLOAD: `${API_BASE_URL}/games/upload`,
  GAME_BY_ID: (id: string) => `${API_BASE_URL}/games/${id}`,
  GAME_DOWNLOAD: (id: string) => `${API_BASE_URL}/games/${id}/download`,
  
  // Metadata endpoints
  METADATA_SOURCES: `${API_BASE_URL}/metadata/sources`,
  METADATA_SEARCH: `${API_BASE_URL}/metadata/search`,
  METADATA_ENRICH: (gameId: string) => `${API_BASE_URL}/metadata/enrich/${gameId}`,
  
  // Steam endpoints
  STEAM_STATUS: `${API_BASE_URL}/api/steam/status`,
  STEAM_USERS: `${API_BASE_URL}/api/steam/users`,
  STEAM_GAMES: (userId: string) => `${API_BASE_URL}/api/steam/games/${userId}`,
  STEAM_ADD_GAME: `${API_BASE_URL}/api/steam/games/add`,
  STEAM_REMOVE_GAME: `${API_BASE_URL}/api/steam/games/remove`,
  STEAM_ADD_ITCH: `${API_BASE_URL}/api/steam/games/add-itch`,
  STEAM_RESTART: `${API_BASE_URL}/api/steam/restart`,
  
  // Itch endpoints
  ITCH_DOWNLOADS: `${API_BASE_URL}/api/itch/downloads`,
  ITCH_GAMES_LOCAL: `${API_BASE_URL}/api/itch/games/local`,
  ITCH_SEARCH: `${API_BASE_URL}/api/itch/search`,
  ITCH_DOWNLOAD: `${API_BASE_URL}/api/itch/download`,
  ITCH_CANCEL_DOWNLOAD: (gameId: string) => `${API_BASE_URL}/api/itch/downloads/${gameId}/cancel`,
  ITCH_RETRY_DOWNLOAD: (gameId: string) => `${API_BASE_URL}/api/itch/downloads/${gameId}/retry`,
  ITCH_DELETE_GAME: (gameId: string) => `${API_BASE_URL}/api/itch/games/${gameId}`,
};

export default API_ENDPOINTS;
