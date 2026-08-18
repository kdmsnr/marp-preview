const { dialog } = require('electron');
const {
  createMainWindow,
  ensureMainWindow,
  focusWindow,
  getMainWindows,
} = require('./mainWindow');
const { loadFile } = require('./fileLoader');
const {
  clearCurrentFilePath,
  findWindowSessionByFilePath,
  getCurrentFilePath,
  getFileIdentity,
  getWindowSession,
  reserveFile,
} = require('./state');

function findEmptyWindow(preferredWindow, reservedWindows) {
  const candidates = [preferredWindow, ...getMainWindows()];
  return (
    candidates.find(
      (window) =>
        window &&
        getWindowSession(window) &&
        !window.isDestroyed?.() &&
        !reservedWindows.has(window) &&
        !getCurrentFilePath(window),
    ) || null
  );
}

async function openFiles(preferredWindow, filePaths) {
  const uniquePaths = [];
  const identities = new Set();

  for (const filePath of filePaths || []) {
    if (!filePath) continue;
    const identity = getFileIdentity(filePath);
    if (!identities.has(identity)) {
      identities.add(identity);
      uniquePaths.push(filePath);
    }
  }

  const reservedWindows = new Set();
  const results = [];
  const loads = [];

  for (const filePath of uniquePaths) {
    const existingSession = findWindowSessionByFilePath(filePath);
    if (existingSession) {
      focusWindow(existingSession.window);
      results.push(existingSession.window);
      continue;
    }

    const window =
      findEmptyWindow(preferredWindow, reservedWindows) || createMainWindow();
    const reservation = reserveFile(window, filePath);
    if (!reservation) continue;

    reservedWindows.add(window);
    results.push(window);
    loads.push(
      loadFile(window, reservation.filePath)
        .then(() => focusWindow(window))
        .catch((error) => {
          if (getCurrentFilePath(window) === reservation.filePath) {
            clearCurrentFilePath(window);
          }
          throw error;
        }),
    );
  }

  await Promise.all(loads);
  return results;
}

function openFilePath(filePath, preferredWindow) {
  return openFiles(preferredWindow, [filePath]);
}

async function openFile(preferredWindow) {
  const ownerWindow =
    getWindowSession(preferredWindow)?.window || ensureMainWindow();

  try {
    const result = await dialog.showOpenDialog(ownerWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return await openFiles(ownerWindow, result.filePaths);
    }
  } catch (err) {
    console.error(err);
    dialog.showErrorBox('Dialog Error', `An error occurred: ${err.message}`);
  }

  return [];
}

module.exports = {
  openFile,
  openFilePath,
  openFiles,
};
