const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const os = require('os');

let mainWindow;
const BACKEND_URL = 'http://localhost:3000';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'assets/icon.png'), // Add your icon
    title: 'game.lib Desktop Client'
  });

  // Load the React frontend build or development server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers for game operations
ipcMain.handle('get-games', async () => {
  try {
    const response = await axios.get(`${BACKEND_URL}/games`);
    return response.data;
  } catch (error) {
    console.error('Error fetching games:', error);
    return [];
  }
});

ipcMain.handle('download-game', async (event, gameId) => {
  try {
    // Get download directory from user
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Download Directory'
    });

    if (result.canceled) return { success: false, message: 'Download canceled' };

    const downloadPath = result.filePaths[0];
    const response = await axios.get(`${BACKEND_URL}/games/${gameId}/download`, {
      responseType: 'stream'
    });

    // Extract filename from headers or use default
    const filename = `game_${gameId}.zip`; // Improve this based on actual file
    const filePath = path.join(downloadPath, filename);

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve) => {
      writer.on('finish', () => {
        resolve({ 
          success: true, 
          message: 'Download completed', 
          filePath: filePath 
        });
      });
      writer.on('error', (error) => {
        resolve({ 
          success: false, 
          message: `Download failed: ${error.message}` 
        });
      });
    });
  } catch (error) {
    return { 
      success: false, 
      message: `Download failed: ${error.message}` 
    };
  }
});

ipcMain.handle('install-game', async (event, filePath, gameName) => {
  try {
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.exe') {
      // Execute installer
      const { spawn } = require('child_process');
      const installer = spawn(filePath, { detached: true, stdio: 'ignore' });
      installer.unref();
      
      return { 
        success: true, 
        message: 'Installer started. Please follow the installation wizard.' 
      };
    } else if (['.zip', '.rar', '.7z'].includes(ext)) {
      // Extract archive (would need additional libraries like node-7z)
      return { 
        success: false, 
        message: 'Archive extraction not yet implemented. Please extract manually.' 
      };
    } else if (ext === '.iso') {
      // Mount ISO (Windows specific)
      return { 
        success: false, 
        message: 'ISO mounting not yet implemented. Please mount manually.' 
      };
    }
    
    return { 
      success: false, 
      message: 'Unsupported file format' 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Installation failed: ${error.message}` 
    };
  }
});

ipcMain.handle('add-to-steam', async (event, gameData) => {
  try {
    // This would integrate with Steam's shortcuts.vdf
    // For now, return a placeholder
    return { 
      success: false, 
      message: 'Steam integration not yet implemented' 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Steam integration failed: ${error.message}` 
    };
  }
});

ipcMain.handle('get-system-info', async () => {
  return {
    platform: os.platform(),
    arch: os.arch(),
    homedir: os.homedir(),
    tmpdir: os.tmpdir()
  };
});
