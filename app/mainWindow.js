const { BrowserWindow } = require('electron');
const path = require('path');
const { clearMainWindow, getMainWindow, setMainWindow } = require('./state');
const { stopWatching } = require('./fileWatcher');

function createMainWindow() {
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  setMainWindow(window);
  window.loadFile(path.join(__dirname, '..', 'index.html'));

  window.on('closed', () => {
    clearMainWindow();
    stopWatching();
  });

  return window;
}

const ensureMainWindow = () => getMainWindow() || createMainWindow();

module.exports = {
  createMainWindow,
  ensureMainWindow,
  getMainWindow,
};
