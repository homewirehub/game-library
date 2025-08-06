# Game Library Installation & Setup Guide

## 🚀 **Quick Start with PostgreSQL**

### **Option 1: Docker Setup (Recommended)**

1. **Start PostgreSQL with Docker:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```
   
   This creates:
   - PostgreSQL database on port 5432
   - PgAdmin web interface on http://localhost:8080
   - Default credentials: `gamelib_user` / `secure_password_change_me`

2. **Start the application:**
   ```bash
   pnpm run dev
   ```

3. **Access installation wizard:**
   - Open http://localhost:5175
   - Follow the installation wizard
   - Use Docker database settings:
     - Host: `localhost`
     - Port: `5432`
     - Username: `gamelib_user`
     - Password: `secure_password_change_me`
     - Database: `gamelib`

### **Option 2: Manual PostgreSQL Setup**

1. **Install PostgreSQL:**
   - Windows: Download from https://www.postgresql.org/download/windows/
   - macOS: `brew install postgresql`
   - Linux: `sudo apt install postgresql postgresql-contrib`

2. **Create database and user:**
   ```sql
   CREATE USER gamelib_user WITH PASSWORD 'your_password';
   CREATE DATABASE gamelib OWNER gamelib_user;
   GRANT ALL PRIVILEGES ON DATABASE gamelib TO gamelib_user;
   ```

3. **Start the application and run installation wizard**

## 🎯 **Installation Wizard Features**

### **Step 1: System Requirements**
- Node.js version check
- Disk space verification
- Memory requirements

### **Step 2: Database Configuration**
- PostgreSQL connection settings
- Database creation
- Connection testing

### **Step 3: Admin Account**
- Administrator username/password
- Email configuration
- Security validation

### **Step 4: Server & Storage**
- Server port and host settings
- Storage directory configuration
- File size limits

### **Step 5: Review & Install**
- Configuration summary
- Final installation process

### **Step 6: Success & Next Steps**
- Installation completion
- Access instructions

## 🔧 **Production Deployment**

### **Environment Variables**
Create `.env` file with:

```env
# Database
DB_TYPE=postgres
DB_HOST=your_postgres_host
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=gamelib

# Server
SERVER_PORT=3000
SERVER_HOST=0.0.0.0
SERVER_DOMAIN=yourdomain.com

# Storage
STORAGE_PATH=/var/lib/gamelib/storage
MAX_FILE_SIZE=2147483648

# Security
JWT_SECRET=your_random_secret_key
BCRYPT_ROUNDS=12
```

### **Build & Deploy**
```bash
# Build backend
cd backend && pnpm build

# Build frontend
cd frontend && pnpm build

# Start production server
cd backend && pnpm start
```

## 📁 **Directory Structure After Installation**

```
game.lib/
├── .env                    # Configuration file
├── .installed             # Installation flag
├── storage/               # Game files and data
│   ├── games/            # Uploaded game files
│   ├── covers/           # Game cover images
│   ├── temp/             # Temporary files
│   └── backups/          # Database backups
├── backend/              # NestJS backend
├── frontend/             # React frontend
└── docker-compose.dev.yml # PostgreSQL setup
```

## 🌟 **Features**

- **🎮 Steam-like Interface**: Modern game library with cover art
- **📊 Multi-source Metadata**: VNDB, Steam, IGDB, RAWG integration
- **🗃️ PostgreSQL Backend**: Robust database with full ACID compliance
- **🔒 Secure Installation**: Nextcloud-style setup wizard
- **📱 Responsive Design**: Works on desktop, tablet, and mobile
- **🚀 Easy Deployment**: Docker support for development and production

## 🔍 **Database Management**

### **PgAdmin Access**
- URL: http://localhost:8080
- Email: admin@gamelib.local
- Password: admin_password_change_me

### **Direct Database Access**
```bash
psql -h localhost -U gamelib_user -d gamelib
```

## 🛡️ **Security Considerations**

- Change default passwords in production
- Use strong JWT secrets
- Configure firewall rules
- Enable SSL/TLS for database connections
- Set up regular backups

## 🎯 **Next Steps After Installation**

1. **Upload your first game**
2. **Configure metadata API keys** (optional)
3. **Set up automated backups**
4. **Configure reverse proxy** (for production)
5. **Set up SSL certificates**

Your Game Library is now ready to manage your complete game collection with professional-grade infrastructure! 🎮
