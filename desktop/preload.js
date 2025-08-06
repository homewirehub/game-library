const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Game operations
  getGames: () => ipcRenderer.invoke('get-games'),
  downloadGame: (gameId) => ipcRenderer.invoke('download-game', gameId),
  installGame: (filePath, gameName) => ipcRenderer.invoke('install-game', filePath, gameName),
  addToSteam: (gameData) => ipcRenderer.invoke('add-to-steam', gameData),
  
  // System info
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // Window controls
  closeApp: () => ipcRenderer.invoke('close-app'),
  minimizeApp: () => ipcRenderer.invoke('minimize-app'),
  
  // File operations
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
});

// DOM ready event
window.addEventListener('DOMContentLoaded', () => {
  // You can add any initialization logic here
  console.log('game.lib Desktop Client loaded');
});
