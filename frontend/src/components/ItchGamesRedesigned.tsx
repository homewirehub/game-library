import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, 
  Card, 
  CardHeader, 
  CardContent, 
  Button, 
  Input, 
  Select, 
  TabBar, 
  TabPanel,
  Grid,
  Flex,
  Stack,
  ScrollableLayout
} from './ui';

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

const ItchGamesRedesigned: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ItchGame[]>([]);
  const [downloads, setDownloads] = useState<DownloadProgress[]>([]);
  const [localGames, setLocalGames] = useState<ItchGame[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [steamUsers, setSteamUsers] = useState<Array<{ id: string; name?: string }>>([]);
  const [selectedSteamUser, setSelectedSteamUser] = useState<string>('');
  const [activeTab, setActiveTab] = useState('search');

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

  const tabs = [
    {
      id: 'search',
      label: 'Search',
      icon: '🔍',
    },
    {
      id: 'downloads',
      label: 'Downloads',
      icon: '⬇️',
      badge: downloads.length > 0 ? downloads.length : undefined,
    },
    {
      id: 'library',
      label: 'Library',
      icon: '📚',
      badge: localGames.length > 0 ? localGames.length : undefined,
    },
  ];

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
    <ScrollableLayout padding="md" maxWidth="xl">
      <Card variant="elevated" padding="none">
        <CardHeader>
          <Stack spacing="lg">
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 600 }}>
              🎮 Itch.io Game Library
            </h1>
            
            <Grid cols="responsive" gap="md">
              <Input
                placeholder="Search for indie games on itch.io..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && searchGames()}
                disabled={isSearching}
                icon="🔍"
                size="lg"
              />
              <Select
                value={selectedSteamUser}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedSteamUser(e.target.value)}
                size="lg"
                options={[
                  { value: '', label: 'Select Steam User' },
                  ...steamUsers.map(user => ({
                    value: user.id,
                    label: user.name || `User ${user.id}`
                  }))
                ]}
              />
            </Grid>
          </Stack>
        </CardHeader>

        <TabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="default"
          size="md"
          fullWidth
        />

        <CardContent>
          <TabPanel tabId="search" activeTab={activeTab}>
            <Stack spacing="lg">
              <Flex justify="start" gap="md">
                <Button
                  variant="primary"
                  size="lg"
                  loading={isSearching}
                  disabled={!searchQuery.trim()}
                  onClick={searchGames}
                  icon="🔍"
                >
                  {isSearching ? 'Searching...' : 'Search Games'}
                </Button>
              </Flex>

              {searchResults.length > 0 && (
                <Grid cols="responsive" gap="lg">
                  {searchResults.map((game) => (
                      <Card key={game.id} variant="default" padding="md" hover interactive>
                        {game.cover_url && (
                          <img 
                            src={game.cover_url} 
                            alt={game.title}
                            style={{
                              width: '100%',
                              height: '200px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              marginBottom: '1rem'
                            }}
                          />
                        )}
                        <Stack spacing="sm">
                          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                            {game.title}
                          </h3>
                          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                            by {game.author}
                          </p>
                          {game.description && (
                            <p style={{ 
                              margin: 0, 
                              color: '#4b5563', 
                              fontSize: '0.875rem',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              lineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {game.description}
                            </p>
                          )}
                          
                          <Flex gap="sm" justify="between">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => downloadGame(game)}
                              icon="⬇️"
                              fullWidth
                            >
                              Download
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(game.url, '_blank')}
                              icon="🌐"
                            >
                              View
                            </Button>
                          </Flex>
                        </Stack>
                      </Card>
                  ))}
                </Grid>
              )}

              {searchResults.length === 0 && searchQuery && !isSearching && (
                <Card variant="outlined" padding="xl">
                  <Flex direction="column" align="center" gap="md">
                    <div style={{ fontSize: '3rem', opacity: 0.5 }}>🔍</div>
                    <h3 style={{ margin: 0, color: '#6b7280' }}>No games found</h3>
                    <p style={{ margin: 0, color: '#9ca3af', textAlign: 'center' }}>
                      No games found for "{searchQuery}". Try a different search term.
                    </p>
                  </Flex>
                </Card>
              )}

              {searchResults.length === 0 && !searchQuery && (
                <Card variant="flat" padding="xl">
                  <Flex direction="column" align="center" gap="md">
                    <div style={{ fontSize: '3rem', opacity: 0.5 }}>🎮</div>
                    <h3 style={{ margin: 0, color: '#6b7280' }}>Search for Games</h3>
                    <p style={{ margin: 0, color: '#9ca3af', textAlign: 'center' }}>
                      Enter a search term above to find indie games on itch.io
                    </p>
                  </Flex>
                </Card>
              )}
            </Stack>
          </TabPanel>          <TabPanel tabId="downloads" activeTab={activeTab}>
            <Stack spacing="lg">
              {downloads.length === 0 ? (
                <Card variant="flat" padding="xl">
                  <Flex direction="column" align="center" gap="md">
                    <div style={{ fontSize: '3rem', opacity: 0.5 }}>⬇️</div>
                    <h3 style={{ margin: 0, color: '#6b7280' }}>No Active Downloads</h3>
                    <p style={{ margin: 0, color: '#9ca3af', textAlign: 'center' }}>
                      Download some games to see progress here
                    </p>
                  </Flex>
                </Card>
              ) : (
                <Stack spacing="md">
                  {downloads.map((download) => (
                    <Card key={download.gameId} variant="default" padding="md">
                      <Stack spacing="md">
                        <Flex justify="between" align="center">
                          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
                            {download.gameId}
                          </h3>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: '9999px',
                            color: getStatusColor(download.status),
                            backgroundColor: `${getStatusColor(download.status)}20`
                          }}>
                            {download.status.toUpperCase()}
                          </span>
                        </Flex>
                        
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                          {download.message}
                        </p>
                        
                        {download.status === 'downloading' && (
                          <div style={{
                            width: '100%',
                            height: '8px',
                            backgroundColor: '#e5e7eb',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${download.progress}%`,
                              height: '100%',
                              backgroundColor: getStatusColor(download.status),
                              borderRadius: '4px',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                        )}
                        
                        {download.error && (
                          <Card variant="outlined" padding="sm" 
                                style={{ borderColor: '#ef4444', backgroundColor: '#fef2f2' }}>
                            <p style={{ margin: 0, color: '#dc2626', fontSize: '0.875rem' }}>
                              <strong>Error:</strong> {download.error}
                            </p>
                          </Card>
                        )}
                        
                        <Flex gap="sm">
                          {download.status === 'failed' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => retryDownload(download.gameId)}
                              icon="🔄"
                            >
                              Retry
                            </Button>
                          )}
                          {['queued', 'downloading', 'extracting'].includes(download.status) && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => cancelDownload(download.gameId)}
                              icon="❌"
                            >
                              Cancel
                            </Button>
                          )}
                        </Flex>
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              )}
            </Stack>
          </TabPanel>

          <TabPanel tabId="library" activeTab={activeTab}>
            <Stack spacing="lg">
              {localGames.length === 0 ? (
                <Card variant="flat" padding="xl">
                  <Flex direction="column" align="center" gap="md">
                    <div style={{ fontSize: '3rem', opacity: 0.5 }}>📚</div>
                    <h3 style={{ margin: 0, color: '#6b7280' }}>No Games in Library</h3>
                    <p style={{ margin: 0, color: '#9ca3af', textAlign: 'center' }}>
                      Download some games to see them in your library
                    </p>
                  </Flex>
                </Card>
              ) : (
                <Grid cols="responsive" gap="lg">
                  {localGames.map((game) => (
                    <Card key={game.id} variant="default" padding="md" hover>
                      <Stack spacing="md">
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                          {game.title}
                        </h3>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                          by {game.author}
                        </p>
                        
                        <Stack spacing="sm">
                          <Button
                            variant="secondary"
                            size="md"
                            onClick={() => addToSteam(game)}
                            disabled={!selectedSteamUser}
                            icon="🎮"
                            fullWidth
                          >
                            Add to Steam
                          </Button>
                          <Flex gap="sm">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => deleteGame(game.id)}
                              icon="🗑️"
                              fullWidth
                            >
                              Delete
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(game.url, '_blank')}
                              icon="🌐"
                              fullWidth
                            >
                              View
                            </Button>
                          </Flex>
                        </Stack>
                      </Stack>
                    </Card>
                  ))}
                </Grid>
              )}
            </Stack>
          </TabPanel>
        </CardContent>
      </Card>
    </ScrollableLayout>
  );
};

export default ItchGamesRedesigned;
