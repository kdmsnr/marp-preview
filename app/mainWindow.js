const { BrowserWindow, shell } = require('electron');
const path = require('path');
const { URL } = require('url');
const {
  getWindowSession,
  getWindowSessions,
  registerWindow,
  setWindowReady,
  unregisterWindow,
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

function isUsableWindow(window) {
  return Boolean(window && !window.isDestroyed?.());
}

function getMainWindows() {
  return getWindowSessions()
    .map((session) => session.window)
    .filter(isUsableWindow);
}

function getFocusedWindow() {
  const focusedWindow = BrowserWindow.getFocusedWindow?.();
  if (isUsableWindow(focusedWindow) && getWindowSession(focusedWindow)) {
    return focusedWindow;
  }

  return getMainWindows()[0] || null;
}

function focusWindow(window) {
  if (!isUsableWindow(window)) return;
  if (window.isMinimized?.()) window.restore?.();
  window.show?.();
  window.focus?.();
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

  registerWindow(window);
  registerExternalLinkHandlers(window);
  const ready = Promise.resolve(
    window.loadFile(path.join(__dirname, '..', 'index.html')),
  );
  setWindowReady(window, ready);
  ready.catch((error) => {
    console.error('Failed to load the preview window:', error);
  });

  window.on('closed', () => {
    stopWatching(window);
    unregisterWindow(window);
  });

  return window;
}

function ensureMainWindow() {
  const window = getFocusedWindow();
  if (window) {
    focusWindow(window);
    return window;
  }

  return createMainWindow();
}

function whenWindowReady(window) {
  return getWindowSession(window)?.ready || Promise.resolve();
}

module.exports = {
  createMainWindow,
  ensureMainWindow,
  focusWindow,
  getFocusedWindow,
  getMainWindows,
  whenWindowReady,
};
