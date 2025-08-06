import React, { useState } from 'react';
import axios from 'axios';
import API_ENDPOINTS from '../config/api';

const GameUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMessage('');
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setMessage('');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
  };

  const uploadGame = async () => {
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(API_ENDPOINTS.GAMES_UPLOAD, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });

      setMessage(`Game "${response.data.title}" uploaded successfully! Metadata processing...`);
      setFile(null);
      setUploadProgress(0);
    } catch (error) {
      setMessage('Error uploading game. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="content-section">
      <div className="page-header">
        <h2 className="page-title">Upload New Game</h2>
        <p className="page-description">Add games to your library by uploading game files</p>
      </div>
      
      <div 
        className={`upload-dropzone ${isDragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        <div className="dropzone-content">
          <div className="upload-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          </div>
          <h3 className="dropzone-title">Drop your game files here</h3>
          <p className="dropzone-description">or click to browse and select files</p>
          <input
            type="file"
            accept=".zip,.rar,.7z,.iso,.exe"
            onChange={handleFileSelect}
            className="file-input sr-only"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="btn btn-primary">
            Choose Files
          </label>
          <p className="file-types-text">
            Supported formats: ZIP, RAR, 7Z, ISO, EXE
          </p>
        </div>
      </div>

      {file && (
        <div className="card file-preview-card">
          <div className="file-preview">
            <div className="file-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </div>
            <div className="file-details">
              <h3 className="file-name">{file.name}</h3>
              <p className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <p className="file-type">{file.name.split('.').pop()?.toUpperCase()} File</p>
            </div>
          </div>
          
          <div className="upload-actions">
            <button 
              onClick={uploadGame} 
              disabled={uploading}
              className={`btn btn-primary ${uploading ? 'loading' : ''}`}
            >
              {uploading ? 'Uploading...' : 'Upload Game'}
            </button>
            <button 
              onClick={() => setFile(null)}
              className="btn btn-secondary"
              disabled={uploading}
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {uploading && (
        <div className="card progress-card">
          <div className="progress-header">
            <h4 className="progress-title">Uploading Game</h4>
            <span className="progress-percentage">{uploadProgress}%</span>
          </div>
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${uploadProgress}%`,
                  transition: 'width 0.3s ease'
                }}
              ></div>
            </div>
          </div>
          <p className="progress-text">
            {uploadProgress < 100 ? 'Uploading file...' : 'Processing game data...'}
          </p>
        </div>
      )}

      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
          <div className="alert-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              {message.includes('Error') ? (
                <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
              ) : (
                <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
              )}
            </svg>
          </div>
          <p>{message}</p>
        </div>
      )}

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          </div>
          <h4 className="feature-title">Upload</h4>
          <p className="feature-description">Upload your game files in supported formats</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
            </svg>
          </div>
          <h4 className="feature-title">Process</h4>
          <p className="feature-description">Automatic metadata detection and game information</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
            </svg>
          </div>
          <h4 className="feature-title">Play</h4>
          <p className="feature-description">Organize and launch your games from the library</p>
        </div>
      </div>
    </div>
  );
};

export default GameUpload;
