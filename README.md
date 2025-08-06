# 🎮 Game Library

A modern, full-stack game library management application built with React, TypeScript, and NestJS. Organize, manage, and launch your game collection with integrated metadata, Steam and Itch.io support.

## ✨ Features

- **📚 Game Library Management**: Upload, organize, and manage your game collection
- **🎨 Modern Dark UI**: Professional gaming-focused interface with responsive design
- **🎮 Steam Integration**: Add games as non-Steam shortcuts with automatic artwork
- **🎯 Itch.io Integration**: Download and manage indie games directly from itch.io
- **📊 Metadata Enrichment**: Automatic game information from multiple sources (IGDB, RAWG, SteamGridDB)
- **🚀 Easy Installation**: Guided setup wizard for first-time configuration
- **🔍 Advanced Search & Filtering**: Find games quickly with powerful search capabilities
- **📱 Responsive Design**: Works perfectly on desktop, tablet, and mobile devices

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **TanStack Query** for data fetching and caching
- **React Router** for navigation
- **Axios** for HTTP requests
- **Modern CSS** with custom design system

### Backend
- **NestJS** with TypeScript
- **TypeORM** with SQLite/PostgreSQL support
- **Multer** for file uploads
- **Class Validator** for request validation
- **JWT** authentication
- **Rate limiting** and security middleware

### Integrations
- **Steam** non-Steam games management
- **Itch.io** via Butler CLI
- **IGDB** (Twitch API) for game metadata
- **RAWG** for additional game information
- **SteamGridDB** for artwork and assets

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm/pnpm
- **Git** for version control

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/game-library.git
   cd game-library
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Start the development servers**:
   ```bash
   pnpm dev
   ```

4. **Open your browser**:
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3001`

5. **Complete setup**:
   - Follow the installation wizard on first run
   - Configure your database and storage preferences
   - Add optional API keys for enhanced features

## 📖 Documentation

- **[Installation Guide](./INSTALLATION.md)** - Detailed setup instructions
- **[Itch.io & Steam Integration](./ITCH_STEAM_GUIDE.md)** - Advanced features guide
- **[Metadata Configuration](./METADATA_GUIDE.md)** - API keys and metadata sources

## ⚙️ Configuration

### Environment Variables

The application uses environment variables for configuration. Copy `.env.example` to `.env` and configure:

```bash
# Database
DB_TYPE=sqlite                    # or 'postgres'
DB_DATABASE=gamelib.db

# Server
SERVER_PORT=3001
SERVER_HOST=localhost

# Optional API Keys (for enhanced features)
IGDB_CLIENT_ID=your_igdb_client_id
IGDB_CLIENT_SECRET=your_igdb_client_secret
RAWG_API_KEY=your_rawg_api_key
STEAMGRIDDB_API_KEY=your_steamgriddb_api_key

# Security
JWT_SECRET=your-super-secret-jwt-key
```

### Optional Integrations

#### Steam Integration
- Automatically detected if Steam is installed
- Adds games as non-Steam shortcuts
- Downloads artwork from SteamGridDB

#### Itch.io Integration
- Requires Butler CLI: `npm install -g @itchio/butler`
- Download games directly from itch.io
- Automatic Steam integration

## 🔧 Development

### Project Structure
```
game-library/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Main application pages
│   │   ├── styles/       # Design system and CSS
│   │   └── config/       # Configuration files
│   └── package.json
├── backend/           # NestJS backend API
│   ├── src/
│   │   ├── modules/      # Feature modules
│   │   ├── entities/     # Database entities
│   │   └── installation/ # Setup wizard
│   └── package.json
├── desktop/           # Electron wrapper (optional)
└── docs/              # Documentation
```

### Available Scripts

```bash
# Development
pnpm dev              # Start both frontend and backend
pnpm dev:frontend     # Start only frontend
pnpm dev:backend      # Start only backend

# Building
pnpm build            # Build both applications
pnpm build:frontend   # Build frontend only
pnpm build:backend    # Build backend only

# Testing
pnpm test             # Run all tests
pnpm test:frontend    # Test frontend only
pnpm test:backend     # Test backend only

# Linting
pnpm lint             # Lint all code
pnpm lint:fix         # Fix linting issues
```

## 🌟 Features in Detail

### Game Library
- Upload games via ZIP files or direct folder selection
- Automatic metadata detection and enrichment
- Custom cover art support
- Tagging and categorization
- Advanced search and filtering options

### Steam Integration
- Detect Steam users automatically
- Add any executable as a non-Steam game
- Download and apply custom artwork
- Support for multiple Steam accounts
- Bulk operations for multiple games

### Itch.io Integration
- Search the entire itch.io catalog
- Download games with progress tracking
- Automatic extraction and installation
- One-click addition to Steam library
- Support for free and paid games

### Metadata Sources
- **IGDB**: Comprehensive game database from Twitch
- **RAWG**: Large video game database
- **SteamGridDB**: High-quality game artwork
- **Steam**: Official Steam metadata
- **Custom**: User-provided information

## 🔒 Security

- **JWT Authentication**: Secure user sessions
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: All inputs validated and sanitized
- **File Upload Security**: Safe file handling with type checking
- **Environment Configuration**: Sensitive data in environment variables

## 📊 Performance

- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Automatic image compression and resizing
- **Database Optimization**: Efficient queries with proper indexing
- **Caching**: API responses cached for better performance
- **Bundling**: Optimized production builds

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**: Change ports in environment variables
2. **Database Connection**: Check database configuration in `.env`
3. **Upload Failures**: Verify storage directory permissions
4. **Steam Not Detected**: Ensure Steam is installed and has been run
5. **Butler Issues**: Install Butler CLI globally

For detailed troubleshooting, see the [Itch.io & Steam Integration Guide](./ITCH_STEAM_GUIDE.md).

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Steam** for the platform and integration possibilities
- **Itch.io** for supporting indie game development
- **IGDB** for comprehensive game metadata
- **SteamGridDB** for high-quality game artwork
- **NestJS** and **React** communities for excellent frameworks

---

**Made with ❤️ for gamers, by gamers**
