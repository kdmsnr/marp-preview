const chokidar = require('chokidar');
const {
  clearWatcher,
  getMainWindow,
  getWatcher,
  setCurrentFilePath,
  setWatcher,
} = require('./state');
const { renderAndSend } = require('./markdownRenderer');

let debounceTimer;

function stopWatching() {
  const watcher = getWatcher();
  if (watcher) {
    watcher.close();
    clearWatcher();
  }
}

function startWatching(filePath) {
  stopWatching();

  const watcher = chokidar.watch(filePath, {
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100,
    },
  });

  setWatcher(watcher);

  watcher.on('change', (changedPath) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      renderAndSend(changedPath);
    }, 300);
  });

  watcher.on('unlink', () => {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('marp-rendered', { html: '', css: '' });
      mainWindow.setTitle('Marp Preview');
    }
    setCurrentFilePath(null);
    stopWatching();
  });
}

module.exports = {
  startWatching,
  stopWatching,
};
