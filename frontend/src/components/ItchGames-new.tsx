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
      // Refresh downloads
      fetchDownloads();
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  const addToSteam = async (game: ItchGame) => {
    if (!selectedSteamUser) {
      alert('Please select a Steam user first');
      return;
    }

    try {
      await axios.post('/api/steam/add-game', {
        userId: selectedSteamUser,
        gameTitle: game.title,
        gamePath: `itch.io/${game.slug}`,
      });
      alert(`${game.title} has been added to Steam!`);
    } catch (error) {
      console.error('Failed to add game to Steam:', error);
      alert('Failed to add game to Steam. Please try again.');
    }
  };

  const deleteGame = async (gameId: string) => {
    if (!confirm('Are you sure you want to delete this game?')) return;

    try {
      await axios.delete(`/api/itch/games/${gameId}`);
      fetchLocalGames();
    } catch (error) {
      console.error('Failed to delete game:', error);
      alert('Failed to delete game. Please try again.');
    }
  };

  const cancelDownload = async (gameId: string) => {
    try {
      await axios.post(`/api/itch/downloads/${gameId}/cancel`);
      fetchDownloads();
    } catch (error) {
      console.error('Failed to cancel download:', error);
    }
  };

  const retryDownload = async (gameId: string) => {
    try {
      await axios.post(`/api/itch/downloads/${gameId}/retry`);
      fetchDownloads();
    } catch (error) {
      console.error('Failed to retry download:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return '#6c757d';
      case 'downloading': return '#0d6efd';
      case 'extracting': return '#fd7e14';
      case 'completed': return '#198754';
      case 'failed': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div className="dark-container">
      {/* Card Container */}
      <div 
        className="max-w-5xl mx-auto my-6 dark-card flex flex-col overflow-hidden" 
        style={{ height: 'calc(100vh - 3rem)' }}
      >
        {/* Header */}
        <header className="dark-card-header">
          <h1 className="text-2xl font-semibold mb-4">🎮 Itch.io Game Library</h1>
          
          {/* Search + User selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              className="dark-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchGames()}
              placeholder="Search for indie games on itch.io..."
              disabled={isSearching}
            />
            <select
              className="dark-input"
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
        </header>

        {/* Tabs */}
        <nav className="flex bg-[#1f2230] border-b border-[#2a2d3c]">
          <button
            onClick={() => setActiveTab('search')}
            className={`dark-tab ${activeTab === 'search' ? 'active' : ''}`}
          >
            🔍 Search
          </button>
          <button
            onClick={() => setActiveTab('downloads')}
            className={`dark-tab ${activeTab === 'downloads' ? 'active' : ''}`}
          >
            ⬇️ Downloads ({downloads.length})
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`dark-tab ${activeTab === 'library' ? 'active' : ''}`}
          >
            📚 Library ({localGames.length})
          </button>
        </nav>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto dark-card-content">
          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="space-y-6">
              <div className="flex gap-3">
                <button 
                  className={`dark-btn ${isSearching ? 'opacity-75' : ''}`}
                  onClick={searchGames} 
                  disabled={isSearching || !searchQuery.trim()}
                >
                  {isSearching ? '🔄 Searching...' : '🔍 Search'}
                </button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((game) => (
                    <div key={game.id} className="dark-card p-4">
                      {game.cover_url && (
                        <img 
                          src={game.cover_url} 
                          alt={game.title}
                          className="w-full h-48 object-cover rounded mb-3"
                        />
                      )}
                      <h3 className="font-semibold text-lg mb-2">{game.title}</h3>
                      <p className="text-sm text-[#7a7e8a] mb-2">by {game.author}</p>
                      {game.description && (
                        <p className="text-sm text-[#b0b3b8] mb-3" style={{ 
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {game.description}
                        </p>
                      )}
                      
                      <div className="flex gap-2">
                        <button 
                          className="dark-btn flex-1 text-sm"
                          onClick={() => downloadGame(game)}
                        >
                          ⬇️ Download
                        </button>
                        <a 
                          href={game.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="dark-btn bg-[#2a2d3c] hover:bg-[#3a3e52] text-sm flex-1 text-center no-underline"
                        >
                          🌐 View
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.length === 0 && searchQuery && !isSearching && (
                <div className="text-center py-12 text-[#7a7e8a]">
                  <p>No games found for "{searchQuery}"</p>
                  <p className="text-sm mt-2">Try a different search term</p>
                </div>
              )}

              {searchResults.length === 0 && !searchQuery && (
                <div className="text-center py-12 text-[#7a7e8a]">
                  <p>Enter a search term to find indie games on itch.io</p>
                </div>
              )}
            </div>
          )}

          {/* Downloads Tab */}
          {activeTab === 'downloads' && (
            <div className="space-y-6">
              {downloads.length === 0 ? (
                <div className="text-center py-12 text-[#7a7e8a]">
                  <p>No active downloads</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {downloads.map((download) => (
                    <div key={download.gameId} className="dark-card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{download.gameId}</h3>
                        <span 
                          className="px-2 py-1 text-xs rounded-full font-medium"
                          style={{ 
                            color: getStatusColor(download.status),
                            backgroundColor: `${getStatusColor(download.status)}20`
                          }}
                        >
                          {download.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-[#b0b3b8] mb-3">{download.message}</p>
                      
                      {download.status === 'downloading' && (
                        <div className="w-full bg-[#2a2d3c] rounded-full h-2 mb-3">
                          <div 
                            className="h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${download.progress}%`,
                              backgroundColor: getStatusColor(download.status)
                            }}
                          ></div>
                        </div>
                      )}
                      
                      {download.error && (
                        <div className="text-sm text-[#dc3545] mb-3 p-2 bg-[#dc354520] rounded">
                          <strong>Error:</strong> {download.error}
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        {download.status === 'failed' && (
                          <button 
                            className="dark-btn text-sm"
                            onClick={() => retryDownload(download.gameId)}
                          >
                            🔄 Retry
                          </button>
                        )}
                        {['queued', 'downloading', 'extracting'].includes(download.status) && (
                          <button 
                            className="dark-btn bg-[#dc3545] hover:bg-[#bb2d3b] text-sm"
                            onClick={() => cancelDownload(download.gameId)}
                          >
                            ❌ Cancel
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
            <div className="space-y-6">
              {localGames.length === 0 ? (
                <div className="text-center py-12 text-[#7a7e8a]">
                  <p>No games in library</p>
                  <p className="text-sm mt-2">Download some games to see them here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {localGames.map((game) => (
                    <div key={game.id} className="dark-card p-4">
                      <h3 className="font-semibold text-lg mb-2">{game.title}</h3>
                      <p className="text-sm text-[#7a7e8a] mb-4">by {game.author}</p>
                      
                      <div className="flex flex-col gap-2">
                        <button 
                          className="dark-btn text-sm"
                          onClick={() => addToSteam(game)}
                          disabled={!selectedSteamUser}
                        >
                          ➕ Add to Steam
                        </button>
                        <div className="flex gap-2">
                          <button 
                            className="dark-btn bg-[#dc3545] hover:bg-[#bb2d3b] text-sm flex-1"
                            onClick={() => deleteGame(game.id)}
                          >
                            🗑️ Delete
                          </button>
                          <a 
                            href={game.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="dark-btn bg-[#2a2d3c] hover:bg-[#3a3e52] text-sm flex-1 text-center no-underline"
                          >
                            🌐 View
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ItchGames;
