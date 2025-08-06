# 🎮 Itch.io & Steam Integration Guide

This guide covers the new itch.io download automation and Steam integration features in the Game Library application.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Itch.io Integration](#itchio-integration)
- [Steam Integration](#steam-integration)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The Game Library now includes powerful integrations with:

- **Itch.io**: Download and manage indie games directly from itch.io
- **Steam**: Add downloaded games as non-Steam shortcuts with custom artwork
- **Automated Workflow**: Search → Download → Add to Steam in one flow

## 🔧 Prerequisites

### Required Software

1. **Butler (Itch.io CLI)**
   ```bash
   # Install globally via npm
   npm install -g @itchio/butler
   
   # Or download from: https://itchio.itch.io/butler
   ```

2. **Steam** (for Steam integration)
   - Steam must be installed and have been run at least once
   - User accounts must have logged in to create user data folders

### Optional API Keys

1. **SteamGridDB API Key** (for automatic artwork)
   - Sign up at: https://www.steamgriddb.com/
   - Get API key from: https://www.steamgriddb.com/profile/preferences
   - Add to `.env`: `STEAMGRIDDB_API_KEY=your_key_here`

## 🚀 Installation

### 1. Install Dependencies

```bash
# Backend dependencies
cd backend
pnpm install

# New dependencies are already included:
# - extract-zip (for game extraction)
# - node-stream-zip (alternative extraction)
# - axios (HTTP requests)
# - fs-extra (enhanced file operations)
```

### 2. Environment Configuration

Add these variables to your `backend/.env` file:

```bash
# Storage Directories
STORAGE_DIR=./storage
DOWNLOAD_DIR=./storage/downloads
INSTALLER_DIR=./storage/installers
INSTALLED_DIR=./storage/installed
STEAM_ASSETS_DIR=./storage/steam-assets
METADATA_DIR=./storage/metadata

# API Keys
STEAMGRIDDB_API_KEY=your_steamgriddb_api_key

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### 3. Verify Installation

1. **Check Butler Installation**:
   ```bash
   butler --version
   ```

2. **Check Steam Detection**:
   - Visit `http://localhost:3001/api/steam/status`
   - Should return: `{"installed": true, "message": "Steam is installed and accessible"}`

3. **Check Itch.io Service**:
   - Visit `http://localhost:3001/api/itch/status`
   - Should return: `{"available": true, "message": "Itch.io CLI (Butler) is available"}`

## 🎮 Itch.io Integration

### Features

- **Game Search**: Search itch.io's catalog
- **Download Management**: Track download progress with real-time updates
- **Library Management**: View and manage downloaded games
- **Steam Integration**: Automatically add downloaded games to Steam

### Usage

#### 1. Search for Games

```typescript
// Frontend - Search games
const searchGames = async (query: string) => {
  const response = await axios.post('/api/itch/search', {
    query: query,
    limit: 20
  });
  return response.data; // Array of ItchGame objects
};
```

#### 2. Download Games

```typescript
// Frontend - Start download
const downloadGame = async (slug: string) => {
  const response = await axios.post('/api/itch/download', {
    slug: slug,
    gameTitle: 'Optional Game Title'
  });
  return response.data.gameId; // Unique download ID
};
```

#### 3. Track Progress

```typescript
// Frontend - Get download progress
const getProgress = async (gameId: string) => {
  const response = await axios.get(`/api/itch/downloads/${gameId}`);
  return response.data; // DownloadProgress object
};
```

### Download Status Flow

1. **queued** → Initial state when download is requested
2. **downloading** → Butler is downloading from itch.io
3. **extracting** → Extracting downloaded files
4. **completed** → Download and extraction finished
5. **failed** → Error occurred (with error message)

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/itch/status` | Check Butler availability |
| `POST` | `/api/itch/search` | Search itch.io games |
| `POST` | `/api/itch/download` | Start game download |
| `GET` | `/api/itch/downloads` | List all downloads |
| `GET` | `/api/itch/downloads/:id` | Get download progress |
| `POST` | `/api/itch/downloads/:id/cancel` | Cancel download |
| `POST` | `/api/itch/downloads/:id/retry` | Retry failed download |
| `GET` | `/api/itch/games/local` | List downloaded games |
| `DELETE` | `/api/itch/games/:id` | Delete downloaded game |

## 🎯 Steam Integration

### Features

- **Non-Steam Game Management**: Add any executable to Steam
- **Automatic Artwork**: Download grid images, heroes, logos, and icons
- **User Management**: Support multiple Steam users
- **Itch.io Integration**: One-click add downloaded games to Steam
- **Bulk Operations**: Add multiple games at once

### Usage

#### 1. Get Steam Users

```typescript
// Frontend - Get available Steam users
const getSteamUsers = async () => {
  const response = await axios.get('/api/steam/users');
  return response.data.users; // Array of Steam user objects
};
```

#### 2. Add Game to Steam

```typescript
// Frontend - Add custom game
const addToSteam = async (gameData) => {
  const response = await axios.post('/api/steam/games/add', {
    userId: 'steam_user_id',
    gameId: 'unique_game_id',
    gameName: 'Game Name',
    executablePath: 'C:\\Path\\To\\Game.exe',
    workingDir: 'C:\\Path\\To\\Game\\', // optional
    iconPath: 'C:\\Path\\To\\Icon.png', // optional
    tags: ['Indie', 'Custom'] // optional
  });
  return response.data;
};
```

#### 3. Add Itch.io Game to Steam

```typescript
// Frontend - Add itch.io game with artwork
const addItchGameToSteam = async (gameData) => {
  const response = await axios.post('/api/steam/games/add-itch', {
    userId: 'steam_user_id',
    gameId: 'itch_game_id',
    gameName: 'Game Name',
    gameSlug: 'author/game-name',
    downloadAssets: true // Downloads artwork automatically
  });
  return response.data;
};
```

### Steam User Detection

Steam users are automatically detected from:
- **Windows**: `%USERPROFILE%\\AppData\\Roaming\\Steam\\userdata`
- **Linux**: `~/.steam/userdata`
- **macOS**: `~/Library/Application Support/Steam/userdata`

### Artwork System

When `downloadAssets: true` is used:

1. **Search SteamGridDB**: Query by game name
2. **Download Assets**: Grid, hero, logo, and icon images
3. **Store Locally**: Save to `STEAM_ASSETS_DIR`
4. **Apply to Steam**: Set as custom artwork

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/steam/status` | Check Steam installation |
| `GET` | `/api/steam/users` | List Steam users |
| `POST` | `/api/steam/games/add` | Add custom game |
| `POST` | `/api/steam/games/add-itch` | Add itch.io game |
| `POST` | `/api/steam/games/add-multiple` | Bulk add games |
| `DELETE` | `/api/steam/games/remove` | Remove game |
| `GET` | `/api/steam/games/:userId` | List user's non-Steam games |
| `POST` | `/api/steam/assets/download` | Download artwork |
| `POST` | `/api/steam/restart` | Restart Steam |

## ⚙️ Configuration

### Environment Variables

```bash
# Database (existing)
DB_TYPE=sqlite
DB_DATABASE=gamelib.db

# Storage Directories
STORAGE_DIR=./storage
DOWNLOAD_DIR=./storage/downloads
INSTALLER_DIR=./storage/installers
INSTALLED_DIR=./storage/installed
STEAM_ASSETS_DIR=./storage/steam-assets
METADATA_DIR=./storage/metadata

# API Keys
STEAMGRIDDB_API_KEY=your_steamgriddb_api_key
RAWG_API_KEY=your_rawg_api_key
IGDB_CLIENT_ID=your_twitch_client_id
IGDB_CLIENT_SECRET=your_twitch_client_secret

# Server
PORT=3001
NODE_ENV=development

# Security
JWT_SECRET=your-super-secret-jwt-key

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Directory Structure

After installation, your storage will be organized as:

```
storage/
├── downloads/          # Active downloads from itch.io
├── installers/         # Extracted game files
├── installed/          # Installed games
├── steam-assets/       # Downloaded Steam artwork
├── metadata/           # Game metadata cache
└── uploads/           # Manual game uploads
```

## 🔍 API Reference

### ItchGame Interface

```typescript
interface ItchGame {
  id: string;
  slug: string;           // e.g., "author/game-name"
  title: string;
  author: string;
  url: string;           // itch.io page URL
  cover_url?: string;
  description?: string;
  tags?: string[];
  platforms?: string[];  // ['windows', 'mac', 'linux', 'web']
  price?: string;        // e.g., "$5.00" or "Free"
  downloads_count?: number;
  published_at?: string;
}
```

### DownloadProgress Interface

```typescript
interface DownloadProgress {
  gameId: string;
  status: 'queued' | 'downloading' | 'extracting' | 'completed' | 'failed';
  progress: number;      // 0-100
  message: string;
  error?: string;        // Present if status is 'failed'
  downloadPath?: string; // Present if status is 'completed'
}
```

### SteamShortcut Interface

```typescript
interface SteamShortcut {
  id: string;
  appName: string;
  exe: string;          // Executable path
  startDir: string;     // Working directory
  icon?: string;        // Icon path
  tags?: string[];      // Steam categories
  lastPlayTime?: number; // Unix timestamp
  isVR?: boolean;
  allowDesktopConfig?: boolean;
  allowOverlay?: boolean;
}
```

### SteamGridAsset Interface

```typescript
interface SteamGridAsset {
  type: 'grid' | 'hero' | 'logo' | 'icon';
  url: string;          // SteamGridDB URL
  localPath?: string;   // Local file path after download
}
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Butler Not Found

**Error**: `"Butler (itch.io CLI) not found"`

**Solutions**:
```bash
# Install Butler globally
npm install -g @itchio/butler

# Or add to PATH if manually installed
# Windows: Add butler.exe location to PATH
# Linux/Mac: Add butler binary location to PATH

# Verify installation
butler --version
```

#### 2. Steam Not Detected

**Error**: `"Steam not found on this system"`

**Solutions**:
- Ensure Steam is installed
- Run Steam at least once to create user data
- Check Steam installation paths:
  - **Windows**: `%USERPROFILE%\\AppData\\Roaming\\Steam`
  - **Linux**: `~/.steam`
  - **macOS**: `~/Library/Application Support/Steam`

#### 3. Download Failures

**Error**: Downloads stuck in "downloading" or fail immediately

**Solutions**:
```bash
# Check Butler authentication
butler login

# Verify itch.io connectivity
butler search "test"

# Check disk space in DOWNLOAD_DIR
df -h # Linux/Mac
dir # Windows

# Clear corrupted downloads
rm -rf storage/downloads/* # Linux/Mac
rmdir /s storage\downloads # Windows
```

#### 4. Steam Integration Issues

**Error**: Games not appearing in Steam

**Solutions**:
1. **Restart Steam**: Use the restart endpoint or manually restart
2. **Check File Paths**: Ensure executable paths are absolute and valid
3. **Verify User Selection**: Confirm correct Steam user is selected
4. **Check Permissions**: Ensure write access to Steam user data directory

#### 5. Artwork Download Issues

**Error**: No artwork downloaded or API errors

**Solutions**:
```bash
# Verify SteamGridDB API key
curl -H "Authorization: Bearer YOUR_KEY" \
  "https://www.steamgriddb.com/api/v2/search/autocomplete/test"

# Check rate limits (100 requests per minute)
# Reduce concurrent artwork downloads

# Verify internet connectivity
ping www.steamgriddb.com
```

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV=development
```

This will provide detailed logs for:
- Butler command execution
- Steam file operations
- API requests and responses
- Download progress updates

### Log Locations

- **Application Logs**: Console output and NestJS logger
- **Butler Logs**: Check Butler's output in download progress
- **Steam Logs**: Steam writes its own logs to Steam directory

### Performance Optimization

1. **Download Concurrency**: Limit simultaneous downloads to 2-3
2. **Artwork Caching**: Enable local artwork cache
3. **Database Optimization**: Use PostgreSQL for better performance
4. **Rate Limiting**: Configure appropriate limits for API endpoints

## 📞 Support

If you encounter issues not covered here:

1. **Check Logs**: Enable debug mode and check console output
2. **Verify Prerequisites**: Ensure Butler and Steam are properly installed
3. **Test API Endpoints**: Use curl or Postman to test endpoints directly
4. **Check Permissions**: Ensure proper file system permissions
5. **Update Dependencies**: Make sure all packages are up to date

For additional help, check the project's GitHub issues or create a new issue with:
- Error messages
- System information (OS, Node version, etc.)
- Steps to reproduce
- Log output (with sensitive information removed)
