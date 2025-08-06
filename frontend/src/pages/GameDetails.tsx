import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import MetadataSearch from '../components/MetadataSearch';
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
  fileName: string;
  filePath: string;
  fileSize: number;
  status: string;
  igdbId?: number;
  rawgId?: number;
  createdAt: string;
  updatedAt: string;
}

const GameDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showMetadataSearch, setShowMetadataSearch] = useState(false);
  const [editedGame, setEditedGame] = useState<Partial<Game>>({});

  // Fetch game details
  const { data: game, isLoading, error } = useQuery({
    queryKey: ['game', id],
    queryFn: async (): Promise<Game> => {
      const response = await axios.get(API_ENDPOINTS.GAME_BY_ID(id!));
      return response.data;
    }
  });

  // Update game mutation
  const updateGameMutation = useMutation({
    mutationFn: async (updatedData: Partial<Game>) => {
      const response = await axios.put(API_ENDPOINTS.GAME_BY_ID(id!), updatedData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', id] });
      queryClient.invalidateQueries({ queryKey: ['games'] });
      setIsEditing(false);
      alert('Game updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating game:', error);
      alert('Error updating game. Please try again.');
    }
  });

  // Delete game mutation
  const deleteGameMutation = useMutation({
    mutationFn: async () => {
      await axios.delete(API_ENDPOINTS.GAME_BY_ID(id!));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
      alert('Game deleted successfully!');
      navigate('/');
    },
    onError: (error) => {
      console.error('Error deleting game:', error);
      alert('Error deleting game. Please try again.');
    }
  });

  useEffect(() => {
    if (game) {
      setEditedGame(game);
    }
  }, [game]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    updateGameMutation.mutate(editedGame);
  };

  const handleCancel = () => {
    setEditedGame(game || {});
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this game? This action cannot be undone.')) {
      deleteGameMutation.mutate();
    }
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.GAME_DOWNLOAD(id!), {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', game?.fileName || 'game-file');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading game:', error);
      alert('Error downloading game. Please try again.');
    }
  };

  const handleInputChange = (field: keyof Game, value: string | number) => {
    setEditedGame(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) return <div className="loading">Loading game details...</div>;
  if (error) return <div className="error">Error loading game details</div>;
  if (!game) return <div className="error">Game not found</div>;

  return (
    <div className="game-details">
      <div className="game-details-header">
        <button onClick={() => navigate('/')} className="back-button">
          ← Back to Library
        </button>
        
        <div className="game-actions">
          {!isEditing ? (
            <>
              <button onClick={handleEdit} className="edit-button">
                Edit Metadata
              </button>
              <button 
                onClick={() => setShowMetadataSearch(!showMetadataSearch)} 
                className="metadata-search-button"
              >
                {showMetadataSearch ? 'Hide' : 'Search'} Metadata
              </button>
              <button onClick={handleDownload} className="download-button">
                Download Game
              </button>
              <button onClick={handleDelete} className="delete-button">
                Delete Game
              </button>
            </>
          ) : (
            <>
              <button onClick={handleSave} className="save-button" disabled={updateGameMutation.isPending}>
                {updateGameMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={handleCancel} className="cancel-button">
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="game-details-content">
        <div className="game-cover-section">
          {(isEditing ? editedGame.coverUrl : game.coverUrl) && (
            <img 
              src={isEditing ? editedGame.coverUrl : game.coverUrl} 
              alt={isEditing ? editedGame.title : game.title}
              className="game-cover-large"
            />
          )}
          
          {isEditing && (
            <div className="cover-edit">
              <label>Cover Image URL:</label>
              <input
                type="url"
                value={editedGame.coverUrl || ''}
                onChange={(e) => handleInputChange('coverUrl', e.target.value)}
                placeholder="https://example.com/cover.jpg"
              />
            </div>
          )}
        </div>

        <div className="game-info-section">
          <div className="metadata-grid">
            <div className="metadata-row">
              <label>Title:</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedGame.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="edit-input"
                />
              ) : (
                <span>{game.title}</span>
              )}
            </div>

            <div className="metadata-row">
              <label>Developer:</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedGame.developer || ''}
                  onChange={(e) => handleInputChange('developer', e.target.value)}
                  className="edit-input"
                  placeholder="Game developer"
                />
              ) : (
                <span>{game.developer || 'Unknown'}</span>
              )}
            </div>

            <div className="metadata-row">
              <label>Publisher:</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedGame.publisher || ''}
                  onChange={(e) => handleInputChange('publisher', e.target.value)}
                  className="edit-input"
                  placeholder="Game publisher"
                />
              ) : (
                <span>{game.publisher || 'Unknown'}</span>
              )}
            </div>

            <div className="metadata-row">
              <label>Release Year:</label>
              {isEditing ? (
                <input
                  type="number"
                  value={editedGame.releaseYear || ''}
                  onChange={(e) => handleInputChange('releaseYear', parseInt(e.target.value))}
                  className="edit-input"
                  min="1970"
                  max={new Date().getFullYear()}
                />
              ) : (
                <span>{game.releaseYear || 'Unknown'}</span>
              )}
            </div>

            <div className="metadata-row">
              <label>Genre:</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedGame.genre || ''}
                  onChange={(e) => handleInputChange('genre', e.target.value)}
                  className="edit-input"
                  placeholder="Action, RPG, Strategy, etc."
                />
              ) : (
                <span>{game.genre || 'Unknown'}</span>
              )}
            </div>

            <div className="metadata-row full-width">
              <label>Description:</label>
              {isEditing ? (
                <textarea
                  value={editedGame.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="edit-textarea"
                  placeholder="Game description..."
                  rows={4}
                />
              ) : (
                <p>{game.description || 'No description available.'}</p>
              )}
            </div>
          </div>

          <div className="file-info-section">
            <h3>File Information</h3>
            <div className="file-info-grid">
              <div className="info-row">
                <span className="label">File Name:</span>
                <span>{game.fileName}</span>
              </div>
              <div className="info-row">
                <span className="label">File Size:</span>
                <span>{formatFileSize(game.fileSize)}</span>
              </div>
              <div className="info-row">
                <span className="label">Status:</span>
                <span className={`status status-${game.status}`}>{game.status}</span>
              </div>
              <div className="info-row">
                <span className="label">Added:</span>
                <span>{formatDate(game.createdAt)}</span>
              </div>
              <div className="info-row">
                <span className="label">Updated:</span>
                <span>{formatDate(game.updatedAt)}</span>
              </div>
              {game.rawgId && (
                <div className="info-row">
                  <span className="label">RAWG ID:</span>
                  <span>{game.rawgId}</span>
                </div>
              )}
              {game.igdbId && (
                <div className="info-row">
                  <span className="label">IGDB ID:</span>
                  <span>{game.igdbId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Metadata Search Component */}
      {showMetadataSearch && (
        <MetadataSearch
          gameId={Number(id)}
          currentTitle={game.title}
          onEnrichmentComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['game', id] });
            setShowMetadataSearch(false);
          }}
        />
      )}
    </div>
  );
};

export default GameDetails;
