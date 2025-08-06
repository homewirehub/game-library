import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ItchGame {
  id: string;
  slug: string;
  title: string;
  author: string;
  url: string;
  cover_url?: string;
  description?: string;
  tags?: string[];
  platforms?: string[];
  price?: string;
  downloads_count?: number;
  published_at?: string;
}

interface DownloadProgress {
  gameId: string;
  status: 'queued' | 'downloading' | 'extracting' | 'completed' | 'failed';
  progress: number;
  message: string;
  error?: string;
  downloadPath?: string;
}

const ItchGames: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ItchGame[]>([]);
  const [downloads, setDownloads] = useState<DownloadProgress[]>([]);
  const [localGames, setLocalGames] = useState<ItchGame[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [steamUsers, setSteamUsers] = useState<Array<{ id: string; name?: string }>>([]);
  const [selectedSteamUser, setSelectedSteamUser] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'search' | 'downloads' | 'library'>('search');

  useEffect(() => {
    fetchSteamUsers();
    fetchDownloads();
    fetchLocalGames();
    
    // Poll downloads every 2 seconds
    const interval = setInterval(fetchDownloads, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchSteamUsers = async () => {
    try {
      const response = await axios.get('/api/steam/users');
      setSteamUsers(response.data.users);
      if (response.data.users.length > 0) {
        setSelectedSteamUser(response.data.users[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch Steam users:', error);
    }
  };

  const fetchDownloads = async () => {
    try {
      const response = await axios.get('/api/itch/downloads');
      setDownloads(response.data);
    } catch (error) {
      console.error('Failed to fetch downloads:', error);
    }
  };

  const fetchLocalGames = async () => {
    try {
      const response = await axios.get('/api/itch/games/local');
      setLocalGames(response.data);
    } catch (error) {
      console.error('Failed to fetch local games:', error);
    }
  };

  const searchGames = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await axios.post('/api/itch/search', {
        query: searchQuery,
        limit: 20,
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed. Please check if the itch.io CLI (Butler) is installed.');
    } finally {
      setIsSearching(false);
    }
  };

  const downloadGame = async (game: ItchGame) => {
    try {
      await axios.post('/api/itch/download', {
        slug: game.slug,
        gameTitle: game.title,
      });
      
      // Switch to downloads tab to see progress
      setActiveTab('downloads');
      fetchDownloads();
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to start download. Please check if the itch.io CLI (Butler) is installed.');
    }
  };

  const addToSteam = async (game: ItchGame) => {
    if (!selectedSteamUser) {
      alert('Please select a Steam user first');
      return;
    }

    try {
      await axios.post('/api/steam/games/add-itch', {
        userId: selectedSteamUser,
        gameId: game.id,
        gameName: game.title,
        gameSlug: game.slug,
        downloadAssets: true,
      });
      
      alert(`${game.title} has been added to Steam!`);
    } catch (error) {
      console.error('Failed to add to Steam:', error);
      alert('Failed to add game to Steam. Please check if Steam is installed.');
    }
  };

  const cancelDownload = async (gameId: string) => {
    try {
      await axios.post(`/api/itch/downloads/${gameId}/cancel`);
      fetchDownloads();
    } catch (error) {
      console.error('Cancel failed:', error);
    }
  };

  const retryDownload = async (gameId: string) => {
    try {
      await axios.post(`/api/itch/downloads/${gameId}/retry`);
      fetchDownloads();
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  const deleteGame = async (gameId: string) => {
    if (!confirm('Are you sure you want to delete this game?')) return;

    try {
      await axios.delete(`/api/itch/games/${gameId}`);
      fetchLocalGames();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'downloading': return '#2196F3';
      case 'extracting': return '#FF9800';
      case 'failed': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <div className="content-section">
      <div className="page-header">
        <h1 className="page-title">🎮 Itch.io Game Library</h1>
        
        {/* Steam User Selection */}
        <div className="form-group">
          <label htmlFor="steam-user" className="label">Steam User:</label>
          <select
            id="steam-user"
            className="select"
            value={selectedSteamUser}
            onChange={(e) => setSelectedSteamUser(e.target.value)}
          >
            <option value="">Select Steam User</option>
            {steamUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name || `User ${user.id}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="nav-tabs">
        <button 
          className={`nav-tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔍 Search
        </button>
        <button 
          className={`nav-tab ${activeTab === 'downloads' ? 'active' : ''}`}
          onClick={() => setActiveTab('downloads')}
        >
          ⬇️ Downloads ({downloads.length})
        </button>
        <button 
          className={`nav-tab ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveTab('library')}
        >
          📚 Library ({localGames.length})
        </button>
      </div>

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="tab-content">
          <div className="search-form">
            <div className="form-group">
              <input
                type="text"
                className="input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchGames()}
                placeholder="Search for indie games on itch.io..."
                disabled={isSearching}
              />
              <button 
                className={`btn btn-primary ${isSearching ? 'loading' : ''}`}
                onClick={searchGames} 
                disabled={isSearching}
              >
                {isSearching ? '🔄 Searching...' : '🔍 Search'}
              </button>
            </div>
          </div>

          <div className="games-grid">
            {searchResults.map((game) => (
              <div key={game.id} className="modern-game-card">
                {game.cover_url && (
                  <img 
                    src={game.cover_url} 
                    alt={game.title}
                    className="game-card-image"
                  />
                )}
                <div className="game-card-content">
                  <h3 className="game-card-title">{game.title}</h3>
                  <p className="game-card-author">by {game.author}</p>
                  {game.description && (
                    <p className="game-card-description">{game.description.slice(0, 100)}...</p>
                  )}
                  <div className="game-card-meta">
                    {game.price && <span className="price-badge">{game.price}</span>}
                    {game.platforms && (
                      <div className="platform-badges">
                        {game.platforms.map((platform, index) => (
                          <span key={index} className="platform-badge">{platform}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="game-card-actions">
                    <button 
                      className="btn btn-primary btn-itch"
                      onClick={() => downloadGame(game)}
                    >
                      ⬇️ Download
                    </button>
                    <button 
                      className="btn btn-steam"
                      onClick={() => addToSteam(game)} 
                      disabled={!selectedSteamUser}
                    >
                      🎮 Add to Steam
                    </button>
                    <a 
                      href={game.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      🌐 View on itch.io
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Downloads Tab */}
      {activeTab === 'downloads' && (
        <div className="tab-content">
          <h2 className="section-title">Active Downloads</h2>
          {downloads.length === 0 ? (
            <div className="empty-state">
              <p>No active downloads</p>
            </div>
          ) : (
            <div className="downloads-list">
              {downloads.map((download) => (
                <div key={download.gameId} className="download-card">
                  <div className="download-header">
                    <h3 className="download-title">{download.gameId}</h3>
                    <span 
                      className={`status-badge status-${download.status}`}
                      style={{ color: getStatusColor(download.status) }}
                    >
                      {download.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="progress-container">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${download.progress}%`,
                          backgroundColor: getStatusColor(download.status)
                        }}
                      />
                    </div>
                    <span className="progress-text">{download.progress}%</span>
                  </div>
                  <p className="download-message">{download.message}</p>
                  {download.error && (
                    <div className="alert alert-error">
                      <strong>Error:</strong> {download.error}
                    </div>
                  )}
                  <div className="download-actions">
                    {download.status === 'downloading' && (
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => cancelDownload(download.gameId)}
                      >
                        ❌ Cancel
                      </button>
                    )}
                    {download.status === 'failed' && (
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => retryDownload(download.gameId)}
                      >
                        🔄 Retry
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Library Tab */}
      {activeTab === 'library' && (
        <div className="tab-content">
          <h2 className="section-title">Downloaded Games</h2>
          {localGames.length === 0 ? (
            <div className="empty-state">
              <p>No games in library. Download some games to get started!</p>
            </div>
          ) : (
            <div className="games-grid">
              {localGames.map((game) => (
                <div key={game.id} className="modern-game-card library-card">
                  <div className="game-card-content">
                    <h3 className="game-card-title">{game.title}</h3>
                    <p className="game-card-author">by {game.author}</p>
                    <div className="game-card-actions">
                      <button 
                        className="btn btn-steam"
                        onClick={() => addToSteam(game)} 
                        disabled={!selectedSteamUser}
                      >
                        🎮 Add to Steam
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteGame(game.id)}
                      >
                        🗑️ Delete
                      </button>
                      <a 
                        href={game.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                      >
                        🌐 View on itch.io
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ItchGames;
