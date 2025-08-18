import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ScrollableLayout,
  Card, 
  CardHeader, 
  CardContent, 
  Button, 
  Input, 
  Select, 
  Grid,
  Flex,
  Stack
} from '../components/ui';
import API_ENDPOINTS from '../config/api';

interface Game {
  id: number;
  title: string;
  description?: string;
  developer?: string;
  publisher?: string;
  releaseYear?: number;
  genre?: string;
  coverUrl?: string;
  status: string;
}

const GameLibraryRedesigned: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'title' | 'releaseYear' | 'status'>('title');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: games, isLoading, error } = useQuery({
    queryKey: ['games'],
    queryFn: async (): Promise<Game[]> => {
      const response = await axios.get(API_ENDPOINTS.GAMES);
      return response.data;
    }
  });

  const filteredAndSortedGames = React.useMemo(() => {
    if (!games) return [];
    
    let filtered = games;
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(game => game.status === filterStatus);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(game => 
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.developer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.genre?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'releaseYear':
          return (b.releaseYear || 0) - (a.releaseYear || 0);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
  }, [games, filterStatus, sortBy, searchQuery]);

  const statusOptions = [
    { value: 'all', label: 'All Games' },
    { value: 'installed', label: 'Installed' },
    { value: 'downloading', label: 'Downloading' },
    { value: 'queued', label: 'Queued' },
    { value: 'error', label: 'Error' },
  ];

  const sortOptions = [
    { value: 'title', label: 'Title' },
    { value: 'releaseYear', label: 'Release Year' },
    { value: 'status', label: 'Status' },
  ];

  if (isLoading) {
    return (
      <ScrollableLayout padding="lg" maxWidth="xl">
        <Card variant="flat" padding="xl">
          <Flex direction="column" align="center" gap="md">
            <div style={{ fontSize: '2rem' }}>⏳</div>
            <h3 style={{ margin: 0, color: '#6b7280' }}>Loading Game Library...</h3>
            <p style={{ margin: 0, color: '#9ca3af', textAlign: 'center' }}>
              Please wait while we fetch your games
            </p>
          </Flex>
        </Card>
      </ScrollableLayout>
    );
  }

  if (error) {
    return (
      <ScrollableLayout padding="lg" maxWidth="xl">
        <Card variant="outlined" padding="xl" 
              style={{ borderColor: '#ef4444', backgroundColor: '#fef2f2' }}>
          <Flex direction="column" align="center" gap="md">
            <div style={{ fontSize: '2rem' }}>❌</div>
            <h3 style={{ margin: 0, color: '#dc2626' }}>Failed to Load Games</h3>
            <p style={{ margin: 0, color: '#b91c1c', textAlign: 'center' }}>
              There was an error loading your game library. Please try again.
            </p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </Flex>
        </Card>
      </ScrollableLayout>
    );
  }

  return (
    <ScrollableLayout padding="lg" maxWidth="xl">
      <Stack spacing="lg">
        {/* Header */}
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <Flex justify="between" align="center" gap="md">
              <Stack spacing="sm">
                <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 600 }}>
                  🎮 Game Library
                </h1>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '1rem' }}>
                  {filteredAndSortedGames.length} {filteredAndSortedGames.length === 1 ? 'game' : 'games'} found
                </p>
              </Stack>
              
              <Link to="/upload">
                <Button variant="primary" size="lg" icon="⬆️">
                  Add Game
                </Button>
              </Link>
            </Flex>
          </CardHeader>
        </Card>

        {/* Filters & Search */}
        <Card variant="default" padding="md">
          <Stack spacing="md">
            <Input
              placeholder="Search games, developers, or genres..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              icon="🔍"
              size="lg"
            />
            
            <Grid cols="responsive" gap="md">
              <Select
                value={filterStatus}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value)}
                options={statusOptions}
                size="md"
              />
              
              <Select
                value={sortBy}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as 'title' | 'releaseYear' | 'status')}
                options={sortOptions}
                size="md"
              />
              
              <Flex gap="sm">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                  size="md"
                  onClick={() => setViewMode('grid')}
                  icon="⊞"
                >
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'ghost'}
                  size="md"
                  onClick={() => setViewMode('list')}
                  icon="☰"
                >
                  List
                </Button>
              </Flex>
            </Grid>
          </Stack>
        </Card>

        {/* Games Grid/List */}
        {filteredAndSortedGames.length === 0 ? (
          <Card variant="flat" padding="xl">
            <Flex direction="column" align="center" gap="md">
              <div style={{ fontSize: '3rem', opacity: 0.5 }}>🎮</div>
              <h3 style={{ margin: 0, color: '#6b7280' }}>
                {searchQuery ? 'No games match your search' : 'No games found'}
              </h3>
              <p style={{ margin: 0, color: '#9ca3af', textAlign: 'center' }}>
                {searchQuery 
                  ? `Try a different search term or check your filters.`
                  : 'Start by adding some games to your library.'
                }
              </p>
              {searchQuery && (
                <Button variant="secondary" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              )}
            </Flex>
          </Card>
        ) : (
          <Grid cols={viewMode === 'grid' ? 'responsive' : 1} gap="lg">
            {filteredAndSortedGames.map((game) => (
              <Link key={game.id} to={`/games/${game.id}`} style={{ textDecoration: 'none' }}>
                <Card variant="default" padding="md" hover interactive>
                  {viewMode === 'grid' ? (
                    <Stack spacing="md">
                      {game.coverUrl && (
                        <img 
                          src={game.coverUrl} 
                          alt={game.title}
                          style={{
                            width: '100%',
                            height: '200px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                          }}
                        />
                      )}
                      <Stack spacing="sm">
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                          {game.title}
                        </h3>
                        {game.developer && (
                          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                            by {game.developer}
                          </p>
                        )}
                        {game.genre && (
                          <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.75rem' }}>
                            {game.genre} {game.releaseYear && `• ${game.releaseYear}`}
                          </p>
                        )}
                        <Flex justify="between" align="center">
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: '9999px',
                            backgroundColor: game.status === 'installed' ? '#10b981' : 
                                            game.status === 'downloading' ? '#3b82f6' : 
                                            game.status === 'error' ? '#ef4444' : '#6b7280',
                            color: 'white'
                          }}>
                            {game.status.toUpperCase()}
                          </span>
                        </Flex>
                      </Stack>
                    </Stack>
                  ) : (
                    <Flex gap="md" align="center">
                      {game.coverUrl && (
                        <img 
                          src={game.coverUrl} 
                          alt={game.title}
                          style={{
                            width: '80px',
                            height: '80px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            flexShrink: 0
                          }}
                        />
                      )}
                      <Stack spacing="sm" style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                          {game.title}
                        </h3>
                        <Flex gap="md" align="center">
                          {game.developer && (
                            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                              {game.developer}
                            </span>
                          )}
                          {game.genre && (
                            <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                              {game.genre}
                            </span>
                          )}
                          {game.releaseYear && (
                            <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                              {game.releaseYear}
                            </span>
                          )}
                        </Flex>
                      </Stack>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '9999px',
                        backgroundColor: game.status === 'installed' ? '#10b981' : 
                                        game.status === 'downloading' ? '#3b82f6' : 
                                        game.status === 'error' ? '#ef4444' : '#6b7280',
                        color: 'white',
                        flexShrink: 0
                      }}>
                        {game.status.toUpperCase()}
                      </span>
                    </Flex>
                  )}
                </Card>
              </Link>
            ))}
          </Grid>
        )}
      </Stack>
    </ScrollableLayout>
  );
};

export default GameLibraryRedesigned;
