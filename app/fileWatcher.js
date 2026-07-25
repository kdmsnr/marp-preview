const chokidar = require('chokidar');
const {
  clearWatcher,
  getMainWindow,
  getWatcher,
  setCurrentFilePath,
  setWatcher,
} = require('./state');
const { renderAndSend } = require('./markdownRenderer');

let debounceTimer = null;
let watchedPaths = new Set();

function clearPendingRender() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}

function stopWatching() {
  clearPendingRender();
  const watcher = getWatcher();
  if (watcher) {
    watcher.close();
    clearWatcher();
  }
  watchedPaths = new Set();
}

function normalizeDependencies(filePath, dependencies = []) {
  return new Set(
    [filePath, ...dependencies].filter(
      (dependency) => typeof dependency === 'string' && dependency,
    ),
  );
}

function updateWatchedPaths(watcher, filePath, dependencies) {
  const nextPaths = normalizeDependencies(filePath, dependencies);
  const addedPaths = Array.from(nextPaths).filter(
    (dependency) => !watchedPaths.has(dependency),
  );
  const removedPaths = Array.from(watchedPaths).filter(
    (dependency) => !nextPaths.has(dependency),
  );

  if (addedPaths.length > 0) {
    watcher.add(addedPaths);
  }
  if (removedPaths.length > 0) {
    watcher.unwatch(removedPaths);
  }

  watchedPaths = nextPaths;
}

function startWatching(filePath, dependencies = [filePath]) {
  stopWatching();

  watchedPaths = normalizeDependencies(filePath, dependencies);
  const watcher = chokidar.watch(Array.from(watchedPaths), {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100,
    },
  });

  setWatcher(watcher);

  const renderEntryFile = () => {
    clearPendingRender();
    debounceTimer = setTimeout(() => {
      Promise.resolve(renderAndSend(filePath)).then((nextDependencies) => {
        if (getWatcher() === watcher && nextDependencies) {
          updateWatchedPaths(watcher, filePath, nextDependencies);
        }
      });
      debounceTimer = null;
    }, 300);
  };

  watcher.on('change', renderEntryFile);
  watcher.on('add', renderEntryFile);

  watcher.on('unlink', (removedPath) => {
    if (removedPath && removedPath !== filePath) {
      renderEntryFile();
      return;
    }

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
