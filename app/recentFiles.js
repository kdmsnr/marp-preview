const fs = require('fs');
const path = require('path');

const MAX_RECENT_FILES = 10;

let recentFiles = [];
const listeners = new Set();
let storagePath = null;

function ensureStorageDir() {
  if (!storagePath) {
    return;
  }
  try {
    fs.mkdirSync(path.dirname(storagePath), { recursive: true });
  } catch (error) {
    console.error('Failed to prepare storage for recent files', error);
  }
}

function persistRecentFiles() {
  if (!storagePath) {
    return;
  }
  try {
    ensureStorageDir();
    fs.writeFileSync(storagePath, JSON.stringify(recentFiles, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save recent files', error);
  }
}

function notifyListeners() {
  const snapshot = [...recentFiles];
  listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch (error) {
      console.error('Error notifying recent file listener', error);
    }
  });
}

function initializeRecentFiles(filePath) {
  storagePath = filePath || null;
  if (!storagePath) {
    return;
  }

  try {
    if (fs.existsSync(storagePath)) {
      const contents = fs.readFileSync(storagePath, 'utf-8');
      const parsed = JSON.parse(contents);
      if (Array.isArray(parsed)) {
        recentFiles = parsed.filter((entry) => typeof entry === 'string');
      }
    } else {
      ensureStorageDir();
    }
  } catch (error) {
    console.error('Failed to load recent files', error);
  }

  notifyListeners();
}

function getRecentFiles() {
  return [...recentFiles];
}

function addRecentFile(filePath) {
  if (!filePath) {
    return;
  }

  const next = [filePath, ...recentFiles.filter((existing) => existing !== filePath)];
  recentFiles = next.slice(0, MAX_RECENT_FILES);
  notifyListeners();
  persistRecentFiles();
}

function removeRecentFile(filePath) {
  const next = recentFiles.filter((existing) => existing !== filePath);
  if (next.length === recentFiles.length) {
    return;
  }
  recentFiles = next;
  notifyListeners();
  persistRecentFiles();
}

function clearRecentFiles() {
  if (recentFiles.length === 0) {
    return;
  }
  recentFiles = [];
  notifyListeners();
  persistRecentFiles();
}

function onRecentFilesChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

module.exports = {
  addRecentFile,
  clearRecentFiles,
  getRecentFiles,
  initializeRecentFiles,
  onRecentFilesChange,
  removeRecentFile,
};
