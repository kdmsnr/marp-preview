const chokidar = require('chokidar');
const { dialog } = require('electron');
const {
  beginRender,
  clearCurrentFilePath,
  getWindowSession,
  isCurrentRender,
} = require('./state');
const { renderAndSend } = require('./markdownRenderer');

function clearPendingRender(session) {
  if (session?.debounceTimer) {
    clearTimeout(session.debounceTimer);
    session.debounceTimer = null;
  }
}

function stopWatching(window) {
  const session = getWindowSession(window);
  if (!session) return;

  clearPendingRender(session);
  if (session.watcher) {
    Promise.resolve(session.watcher.close()).catch((error) => {
      console.error('Failed to stop watching files:', error);
    });
    session.watcher = null;
  }
  session.watchedPaths = new Set();
}

function normalizeDependencies(filePath, dependencies = []) {
  return new Set(
    [filePath, ...dependencies].filter(
      (dependency) => typeof dependency === 'string' && dependency,
    ),
  );
}

function updateWatchedPaths(session, watcher, filePath, dependencies) {
  const nextPaths = normalizeDependencies(filePath, dependencies);
  const addedPaths = Array.from(nextPaths).filter(
    (dependency) => !session.watchedPaths.has(dependency),
  );
  const removedPaths = Array.from(session.watchedPaths).filter(
    (dependency) => !nextPaths.has(dependency),
  );

  if (addedPaths.length > 0) {
    watcher.add(addedPaths);
  }
  if (removedPaths.length > 0) {
    watcher.unwatch(removedPaths);
  }

  session.watchedPaths = nextPaths;
}

function startWatching(window, filePath, dependencies = [filePath]) {
  stopWatching(window);
  const session = getWindowSession(window);
  if (!session) return;

  session.watchedPaths = normalizeDependencies(filePath, dependencies);
  const watcher = chokidar.watch(Array.from(session.watchedPaths), {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100,
    },
  });

  session.watcher = watcher;

  const renderEntryFile = () => {
    if (session.watcher !== watcher) return;
    clearPendingRender(session);
    session.debounceTimer = setTimeout(() => {
      session.debounceTimer = null;
      const revision = beginRender(window, filePath);
      if (revision === null) return;

      Promise.resolve(renderAndSend(window, filePath, revision))
        .then((nextDependencies) => {
          if (
            session.watcher === watcher &&
            isCurrentRender(window, filePath, revision) &&
            nextDependencies
          ) {
            updateWatchedPaths(session, watcher, filePath, nextDependencies);
          }
        })
        .catch((error) => {
          console.error('Failed to refresh the preview:', error);
        });
    }, 300);
  };

  watcher.on('change', renderEntryFile);
  watcher.on('add', renderEntryFile);

  watcher.on('error', (error) => {
    if (session.watcher !== watcher) return;
    console.error('Failed to watch files:', error);
    dialog.showErrorBox(
      'File Watch Error',
      `The preview will no longer update automatically: ${error.message}`,
    );
    stopWatching(window);
  });

  watcher.on('unlink', (removedPath) => {
    if (session.watcher !== watcher) return;
    if (removedPath && removedPath !== filePath) {
      renderEntryFile();
      return;
    }

    clearCurrentFilePath(window);
    if (!window.isDestroyed?.()) {
      window.webContents.send('marp-rendered', { html: '', css: '' });
      window.setTitle('Marp Preview');
      window.setRepresentedFilename?.('');
    }
    stopWatching(window);
  });
}

module.exports = {
  startWatching,
  stopWatching,
};
