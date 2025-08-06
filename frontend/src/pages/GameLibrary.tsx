import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import axios from 'axios';
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

const GameLibrary: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'title' | 'releaseYear' | 'status'>('title');

  const { data: games, isLoading, error } = useQuery({
    queryKey: ['games'],
    queryFn: async (): Promise<Game[]> => {
      const response = await axios.get(API_ENDPOINTS.GAMES);
      return response.data;
    }
  });

  const filteredAndSortedGames = React.useMemo(() => {
    if (!games) return [];
    
    let filtered = filterStatus === 'all' 
      ? games 
      : games.filter(game => game.status === filterStatus);
    
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
  }, [games, filterStatus, sortBy]);

  if (isLoading) return (
    <div className="loading-container">
      <div className="spinner spinner-lg"></div>
      <p className="loading-text">Loading your game library...</p>
    </div>
  );
  
  if (error) return (
    <div className="error-container">
      <h3 className="error-title">Error loading games</h3>
      <p className="error-message">Please try refreshing the page</p>
      <button 
        className="btn btn-primary"
        onClick={() => window.location.reload()}
      >
        Refresh Page
      </button>
    </div>
  );

  return (
    <div className="content-section">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Your Game Library</h1>
        <p className="page-description">
          Manage and organize your game collection with powerful filtering and search capabilities
        </p>
      </div>
      
      {/* Library Controls */}
      <div className="section-header">
        <div className="flex items-center gap-4">
          <h2 className="section-title">Games</h2>
          <span className="platform-badge">
            {filteredAndSortedGames.length} {filteredAndSortedGames.length === 1 ? 'game' : 'games'}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Filter Controls */}
          <div className="flex gap-3">
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="select input-sm"
            >
              <option value="all">All Games</option>
              <option value="processed">Ready to Play</option>
              <option value="uploaded">Processing</option>
            </select>
            
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="select input-sm"
            >
              <option value="title">Sort by Title</option>
              <option value="releaseYear">Sort by Year</option>
              <option value="status">Sort by Status</option>
            </select>
          </div>
          
          {/* View Controls */}
          <div className="btn-group">
            <button 
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,3H11V11H3V3M13,3H21V11H13V3M3,13H11V21H3V13M13,13H21V21H13V13Z" />
              </svg>
            </button>
            <button 
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9,5V9H21V5M9,19H21V15H9M9,14H21V10H9M4,9H8V5H4M4,19H8V15H4M4,14H8V10H4V14Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Games Grid/List */}
      {filteredAndSortedGames.length > 0 ? (
        <div className={viewMode === 'grid' ? 'card-grid' : 'card-list'}>
          {filteredAndSortedGames.map((game, index) => (
            <div 
              key={game.id} 
              className={`modern-game-card ${viewMode === 'list' ? 'flex gap-6' : ''}`}
              style={{ 
                animationDelay: `${index * 50}ms`,
              } as React.CSSProperties}
            >
              <div className={`game-card-image-container ${viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}`}>
                {game.coverUrl ? (
                  <img 
                    src={game.coverUrl} 
                    alt={game.title} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full bg-neutral-100 text-neutral-500">
                    <svg className="w-12 h-12 mb-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19,4C20.1,4 21,4.9 21,6V18A2,2 0 0,1 19,20H5A2,2 0 0,1 3,18V6A2,2 0 0,1 5,4H19M5,8V18H19V8H5M13.5,12.5L10.5,16.5L8.5,14L5.5,18H18.5L13.5,12.5Z" />
                    </svg>
                    <span className="text-sm">No Cover</span>
                  </div>
                )}
                
                {/* Overlay for grid view */}
                {viewMode === 'grid' && (
                  <div className="game-card-overlay">
                    <div className="game-card-actions">
                      <Link to={`/games/${game.id}`} className="btn btn-primary btn-sm">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                        </svg>
                        Play
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              
              <div className={`game-card-info ${viewMode === 'list' ? 'flex-1' : ''}`}>
                <div className="game-card-meta">
                  <div className="game-status">
                    <div className={`game-status-dot ${game.status}`}></div>
                    <span className="text-sm font-medium">
                      {game.status === 'processed' ? 'Ready' : 'Processing'}
                    </span>
                  </div>
                  
                  {game.genre && (
                    <span className="platform-badge platform-badge-sm">
                      {game.genre}
                    </span>
                  )}
                </div>
                
                <h3 className="game-card-title">{game.title}</h3>
                
                {game.description && (
                  <p className="game-card-description">
                    {viewMode === 'list' ? game.description : game.description.substring(0, 100) + '...'}
                  </p>
                )}
                
                {(game.developer || game.releaseYear) && (
                  <div className="flex items-center gap-4 text-sm text-neutral-500 mb-4">
                    {game.developer && <span>by {game.developer}</span>}
                    {game.releaseYear && <span>• {game.releaseYear}</span>}
                  </div>
                )}
                
                <div className="game-card-actions">
                  <Link to={`/games/${game.id}`} className="btn btn-outline-primary btn-sm">
                    View Details
                  </Link>
                  
                  {game.status === 'processed' && (
                    <button className="btn btn-primary btn-sm">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                      </svg>
                      Play
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,4C20.1,4 21,4.9 21,6V18A2,2 0 0,1 19,20H5A2,2 0 0,1 3,18V6A2,2 0 0,1 5,4H19M5,8V18H19V8H5Z" />
            </svg>
          </div>
          <h3 className="empty-state-title">Your library is empty</h3>
          <p className="empty-state-description">
            Start building your collection by uploading your first game or connecting your itch.io account
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/upload" className="btn btn-primary">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
              Upload Game
            </Link>
            <Link to="/itch" className="btn btn-accent">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,12V6.75L9,5.43V10.25C9,10.25 9.62,11 10.5,11C11.38,11 12,10.25 12,10.25V5.43L18,6.75V12H15V18.85C15,18.85 12.5,19 12,19C11.5,19 9,18.85 9,18.85V12H3Z" />
              </svg>
              Browse Itch.io
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
export default GameLibrary;
