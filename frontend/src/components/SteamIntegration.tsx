import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface SteamUser {
  id: string;
  name?: string;
  path: string;
}

interface SteamShortcut {
  id: string;
  appName: string;
  exe: string;
  startDir: string;
  icon?: string;
  tags?: string[];
  lastPlayTime?: number;
}

const SteamIntegration: React.FC = () => {
  const [steamUsers, setSteamUsers] = useState<SteamUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [steamGames, setSteamGames] = useState<SteamShortcut[]>([]);
  const [steamInstalled, setSteamInstalled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkSteamStatus();
    fetchSteamUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchSteamGames();
    }
  }, [selectedUser]);

  const checkSteamStatus = async () => {
    try {
      const response = await axios.get('/api/steam/status');
      setSteamInstalled(response.data.installed);
    } catch (error) {
      console.error('Failed to check Steam status:', error);
      setSteamInstalled(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchSteamUsers = async () => {
    try {
      const response = await axios.get('/api/steam/users');
      setSteamUsers(response.data.users);
      if (response.data.users.length > 0) {
        setSelectedUser(response.data.users[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch Steam users:', error);
    }
  };

  const fetchSteamGames = async () => {
    if (!selectedUser) return;

    try {
      const response = await axios.get(`/api/steam/games/${selectedUser}`);
      setSteamGames(response.data);
    } catch (error) {
      console.error('Failed to fetch Steam games:', error);
    }
  };

  const removeFromSteam = async (gameId: string) => {
    if (!selectedUser) return;
    if (!confirm('Are you sure you want to remove this game from Steam?')) return;

    try {
      await axios.delete('/api/steam/games/remove', {
        data: {
          userId: selectedUser,
          gameId: gameId,
        },
      });
      
      fetchSteamGames(); // Refresh the list
      alert('Game removed from Steam successfully!');
    } catch (error) {
      console.error('Failed to remove game from Steam:', error);
      alert('Failed to remove game from Steam.');
    }
  };

  const restartSteam = async () => {
    if (!confirm('This will restart Steam. Continue?')) return;

    try {
      await axios.post('/api/steam/restart');
      alert('Steam restart initiated. Please wait a moment for Steam to reload.');
    } catch (error) {
      console.error('Failed to restart Steam:', error);
      alert('Failed to restart Steam.');
    }
  };

  const addCustomGame = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const formData = new FormData(event.currentTarget);
    const gameData = {
      userId: selectedUser,
      gameId: Date.now().toString(), // Simple ID generation
      gameName: formData.get('gameName') as string,
      executablePath: formData.get('executablePath') as string,
      workingDir: formData.get('workingDir') as string || undefined,
      iconPath: formData.get('iconPath') as string || undefined,
      tags: ['Custom Game', 'Game Library'],
    };

    if (!gameData.gameName || !gameData.executablePath) {
      alert('Game name and executable path are required');
      return;
    }

    try {
      await axios.post('/api/steam/games/add', gameData);
      
      fetchSteamGames(); // Refresh the list
      alert('Game added to Steam successfully!');
      
      // Reset form
      event.currentTarget.reset();
    } catch (error) {
      console.error('Failed to add game to Steam:', error);
      alert('Failed to add game to Steam.');
    }
  };

  const formatLastPlayTime = (timestamp?: number): string => {
    if (!timestamp || timestamp === 0) return 'Never played';
    
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="content-section">
        <div className="loading-state">
          <div className="loading-spinner">Loading Steam integration...</div>
        </div>
      </div>
    );
  }

  if (!steamInstalled) {
    return (
      <div className="content-section">
        <div className="alert alert-error">
          <h2>❌ Steam Not Found</h2>
          <p>Steam is not installed or not accessible on this system.</p>
          <p>Please install Steam and restart the application.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-section">
      <div className="page-header">
        <h1 className="page-title">🎮 Steam Integration</h1>
        <button 
          onClick={restartSteam} 
          className="btn btn-secondary"
        >
          🔄 Restart Steam
        </button>
      </div>

      <div className="alert alert-success">
        <h2>✅ Steam Detected</h2>
        <p>Steam is installed and accessible. You can manage non-Steam games.</p>
      </div>

      {/* Steam User Selection */}
      <div className="card">
        <h3 className="card-title">Steam Users</h3>
        <div className="form-group">
          <select 
            value={selectedUser} 
            onChange={(e) => setSelectedUser(e.target.value)}
            className="select"
          >
            <option value="">Select a Steam user</option>
            {steamUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name || `User ${user.id}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedUser && (
        <>
          {/* Add Custom Game Form */}
          <div className="card">
            <h3 className="card-title">Add Custom Game to Steam</h3>
            <form onSubmit={addCustomGame} className="form">
              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    name="gameName"
                    className="input"
                    placeholder="Game Name *"
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="executablePath"
                    className="input"
                    placeholder="Executable Path *"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    name="workingDir"
                    className="input"
                    placeholder="Working Directory (optional)"
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="iconPath"
                    className="input"
                    placeholder="Icon Path (optional)"
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">
                ➕ Add to Steam
              </button>
            </form>
          </div>

          {/* Current Non-Steam Games */}
          <div className="card">
            <h3 className="card-title">Non-Steam Games ({steamGames.length})</h3>
            
            {steamGames.length === 0 ? (
              <div className="empty-state">
                <p>No non-Steam games found for this user.</p>
                <p>Add some games using the form above or through the Itch.io integration!</p>
              </div>
            ) : (
              <div className="games-list">
                {steamGames.map((game) => (
                  <div key={game.id} className="game-card-horizontal">
                    <div className="game-card-header">
                      <h4 className="game-card-title">{game.appName}</h4>
                      <div className="game-tags">
                        {game.tags?.map((tag, index) => (
                          <span key={index} className="tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="game-details">
                      <div className="detail-row">
                        <span className="detail-label">Executable:</span>
                        <span className="detail-value">{game.exe}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Working Dir:</span>
                        <span className="detail-value">{game.startDir}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Last Played:</span>
                        <span className="detail-value">{formatLastPlayTime(game.lastPlayTime)}</span>
                      </div>
                    </div>
                    
                    <div className="game-card-actions">
                      <button 
                        onClick={() => removeFromSteam(game.id)}
                        className="btn btn-danger btn-sm"
                      >
                        🗑️ Remove from Steam
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Help Section */}
      <div className="card help-card">
        <h3 className="card-title">ℹ️ Help</h3>
        <div className="help-content">
          <div className="help-section">
            <h4 className="help-subtitle">How to use Steam Integration:</h4>
            <ul className="help-list">
              <li><strong>Select a Steam User:</strong> Choose which Steam account to manage</li>
              <li><strong>Add Custom Games:</strong> Manually add any executable to Steam</li>
              <li><strong>Itch.io Integration:</strong> Games downloaded through Itch.io can be automatically added to Steam</li>
              <li><strong>Restart Steam:</strong> After adding games, restart Steam to see them in your library</li>
            </ul>
          </div>
          
          <div className="help-section">
            <h4 className="help-subtitle">Supported Features:</h4>
            <ul className="help-list">
              <li>✅ Add non-Steam games with custom names and paths</li>
              <li>✅ Automatic artwork download (when SteamGridDB API key is configured)</li>
              <li>✅ Custom tags and categories</li>
              <li>✅ Remove non-Steam games</li>
              <li>✅ Steam restart integration</li>
            </ul>
          </div>
          
          <div className="help-section">
            <h4 className="help-subtitle">Tips:</h4>
            <ul className="help-list">
              <li>Configure STEAMGRIDDB_API_KEY in your environment for automatic artwork</li>
              <li>Use absolute paths for executables to avoid issues</li>
              <li>Tags help organize your games in Steam</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SteamIntegration;
