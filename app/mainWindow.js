const { BrowserWindow, shell } = require('electron');
const path = require('path');
const { URL } = require('url');
const {
  clearCurrentFilePath,
  clearMainWindow,
  getMainWindow,
  setMainWindow,
} = require('./state');
const { stopWatching } = require('./fileWatcher');

const EXTERNAL_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

function isExternalUrl(url) {
  try {
    return EXTERNAL_URL_PROTOCOLS.has(new URL(url).protocol);
  } catch {
    return false;
  }
}

function openExternalUrl(url) {
  shell.openExternal(url).catch(() => {});
}

function registerExternalLinkHandlers(window) {
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternalUrl(url)) {
      openExternalUrl(url);
    }

    return { action: 'deny' };
  });

  window.webContents.on('will-navigate', (event, url) => {
    if (!isExternalUrl(url)) {
      return;
    }

    event.preventDefault();
    openExternalUrl(url);
  });
}

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
  registerExternalLinkHandlers(window);
  window.loadFile(path.join(__dirname, '..', 'index.html'));

  window.on('closed', () => {
    clearCurrentFilePath();
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
