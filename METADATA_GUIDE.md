# Multi-Source Metadata System

This guide explains how to configure and use the comprehensive metadata system that integrates with multiple game databases including IGDB, VNDB, RAWG, and Steam.

## 🎯 Overview

The metadata system provides:
- **Multi-source integration**: IGDB, VNDB, RAWG, Steam
- **Automatic metadata enrichment**: Cover images, descriptions, release info
- **Manual search & selection**: Choose the best metadata match
- **Visual novel support**: Specialized VNDB integration
- **Fallback sources**: Multiple sources ensure metadata availability

## 🔧 Configuration

### 1. API Keys Setup

Create a `.env` file in the `backend/` folder:

```bash
# IGDB (Twitch API) - Best for general games
# Get from: https://dev.twitch.tv/console/apps
IGDB_CLIENT_ID=your_igdb_client_id_here
IGDB_CLIENT_SECRET=your_igdb_client_secret_here

# RAWG API - Good fallback source
# Get from: https://rawg.io/apidocs
RAWG_API_KEY=your_rawg_api_key_here

# Database Configuration
DB_TYPE=sqlite
DB_DATABASE=gamelib.db

# Other Configuration
NODE_ENV=development
PORT=3000
```

### 2. Source Priorities

Sources are queried in order of priority:
1. **IGDB** (Priority 1) - Comprehensive game database
2. **VNDB** (Priority 2) - Visual novel specialist
3. **RAWG** (Priority 3) - Large game database
4. **Steam** (Priority 4) - Steam store data

### 3. Source Capabilities

| Source | General Games | Visual Novels | API Key Required | Screenshots | Release Info |
|--------|---------------|---------------|------------------|-------------|--------------|
| IGDB   | ✅ Excellent  | ⚠️ Limited    | ✅ Yes           | ✅ Yes      | ✅ Yes       |
| VNDB   | ❌ No         | ✅ Excellent  | ❌ No            | ✅ Yes      | ✅ Yes       |
| RAWG   | ✅ Good       | ❌ No         | ✅ Yes           | ✅ Yes      | ✅ Yes       |
| Steam  | ✅ Good       | ⚠️ Limited    | ❌ No            | ✅ Yes      | ✅ Yes       |

## 🚀 Usage

### Automatic Metadata Enrichment

When you upload a game, the system automatically:

1. **Extracts game name** from filename
2. **Searches all available sources** in parallel
3. **Ranks results** by relevance score
4. **Applies best metadata** to your game
5. **Updates cover image, description, and details**

### Manual Metadata Search

From the game details page:

1. Click **"Search Metadata"** button
2. **Select preferred sources** (optional)
3. **Enter custom search query** if needed
4. **Review search results** from all sources
5. **Click "Use This Result"** to apply metadata

### API Endpoints

#### Get Available Sources
```bash
GET /metadata/sources
```
Returns list of sources with availability status.

#### Search Metadata
```bash
GET /metadata/search?query=game+name&sources=IGDB,VNDB&maxResults=10
```
Search across specified sources for metadata.

#### Get Specific Metadata
```bash
GET /metadata/source/VNDB/v21905
```
Get detailed metadata from a specific source and ID.

#### Enrich Game Metadata
```bash
POST /metadata/enrich/1
{
  "searchQuery": "Custom Game Name",
  "sources": ["IGDB", "VNDB"]
}
```
Manually enrich metadata for a specific game.

## 🎮 Supported Game Types

### Regular Games
- **Best sources**: IGDB, RAWG, Steam
- **Automatic detection**: Based on filename
- **Rich metadata**: Screenshots, ratings, platforms

### Visual Novels
- **Best source**: VNDB (specialized)
- **Comprehensive tags**: Content categories, technical info
- **Length estimates**: Reading time information
- **Language support**: Multiple language availability

### Indie Games
- **Best sources**: RAWG, Steam
- **Developer info**: Independent developer details
- **Store links**: Direct purchase links

## 🔍 Search Query Optimization

The system automatically cleans filenames for better search results:

### Automatic Cleanup
- Removes file extensions (`.zip`, `.exe`, etc.)
- Strips version numbers (`v1.2.3`)
- Removes year indicators (`(2023)`)
- Cleans special characters and brackets
- Normalizes spacing

### Manual Query Tips
- Use the **official game title** when possible
- Try **alternative titles** or **localizations**
- Use **developer name** + game name for indies
- For visual novels, try both **English** and **Japanese** titles

## 📊 Metadata Quality

### High Quality Sources
- **IGDB**: Professional game database, excellent for AAA games
- **VNDB**: Community-driven, exceptional for visual novels

### Medium Quality Sources
- **RAWG**: Large database, good coverage but variable quality
- **Steam**: Accurate but limited to Steam catalog

### Quality Indicators
- **Relevance Score**: 0.0 - 1.0 (higher is better)
- **Source Priority**: Lower numbers = higher quality
- **Cover Image**: High-resolution images preferred
- **Description Length**: Longer descriptions usually better

## 🛠️ Troubleshooting

### No Metadata Found
1. **Check source availability** via `/metadata/sources`
2. **Try alternative search terms**
3. **Check API key configuration**
4. **Use manual search** with custom query

### Poor Quality Results
1. **Refine search query** manually
2. **Select specific sources** only
3. **Try different combinations** of search terms
4. **Use alternative titles** or abbreviations

### API Rate Limits
- **IGDB**: 4 requests per second
- **RAWG**: 20,000 requests per month (free tier)
- **VNDB**: 100 requests per 10 minutes
- **Steam**: No official limits, but throttled

### Common Issues

#### RAWG 401 Unauthorized
```
Error: Request failed with status code 401
```
**Solution**: Get valid API key from https://rawg.io/apidocs

#### IGDB Authentication Failed
```
Error: Failed to authenticate with IGDB
```
**Solution**: Check Twitch Client ID and Secret in `.env`

#### VNDB Connection Timeout
```
Error: VNDB is not available
```
**Solution**: Check internet connection, VNDB may be temporarily down

## 🎯 Best Practices

### For Game Libraries
1. **Enable automatic enrichment** for bulk uploads
2. **Review results** for important games manually
3. **Use preferred sources** for specific game types
4. **Customize search queries** for difficult-to-find games

### For Visual Novel Collections
1. **Prioritize VNDB** as primary source
2. **Search by Japanese titles** if English search fails
3. **Use official title variations**
4. **Check for fan translations** vs official releases

### For Indie Game Collections
1. **Use developer name** + game title
2. **Try Steam** if other sources fail
3. **Check itch.io** titles manually
4. **Use alternative spellings** for foreign games

## 📈 Performance Optimization

### Parallel Processing
- All sources searched **simultaneously**
- **Non-blocking** API calls
- **Timeout handling** for slow sources

### Caching Strategy
- **Results cached** in game database
- **Avoid re-fetching** same metadata
- **Update mechanism** for outdated data

### Resource Management
- **Connection pooling** for HTTP requests
- **Rate limiting** compliance
- **Error handling** and retries

## 🔄 Future Enhancements

### Planned Features
- **HowLongToBeat** integration for play time
- **Metacritic** scores and reviews
- **MobyGames** historical data
- **Custom source plugins**

### Community Sources
- **User submissions** for missing games
- **Community ratings** and reviews
- **Screenshot contributions**
- **Translation status** tracking

---

## Quick Start Checklist

- [ ] Copy `.env.example` to `.env` in backend folder
- [ ] Get IGDB credentials from Twitch Developer Console
- [ ] Get RAWG API key from RAWG website
- [ ] Test source availability: `GET /metadata/sources`
- [ ] Upload a game and check automatic enrichment
- [ ] Try manual metadata search from game details
- [ ] Configure preferred sources for your collection

Your metadata system is now ready to automatically enrich your game library with comprehensive information from multiple high-quality sources!
