let mainWindow = null;
let watcher = null;
let currentFilePath = null;

const setMainWindow = (window) => {
  mainWindow = window;
};

const clearMainWindow = () => {
  mainWindow = null;
};

const getMainWindow = () => mainWindow;

const setWatcher = (newWatcher) => {
  watcher = newWatcher;
};

const clearWatcher = () => {
  watcher = null;
};

const getWatcher = () => watcher;

const setCurrentFilePath = (filePath) => {
  currentFilePath = filePath;
};

const getCurrentFilePath = () => currentFilePath;

module.exports = {
  clearMainWindow,
  clearWatcher,
  getCurrentFilePath,
  getMainWindow,
  getWatcher,
  setCurrentFilePath,
  setMainWindow,
  setWatcher,
};
