const fs = require('fs');
const path = require('path');

const sessions = new Map();

function getWindowId(window) {
  return window?.id;
}

function resolveFilePath(filePath) {
  return path.resolve(filePath);
}

function getFileIdentity(filePath) {
  const resolvedPath = resolveFilePath(filePath);

  try {
    return fs.realpathSync.native(resolvedPath);
  } catch {
    return resolvedPath;
  }
}

function registerWindow(window) {
  const windowId = getWindowId(window);
  if (windowId === undefined || windowId === null) {
    throw new TypeError('A window with an id is required.');
  }

  const existingSession = sessions.get(windowId);
  if (existingSession) {
    return existingSession;
  }

  const session = {
    window,
    ready: Promise.resolve(),
    currentFilePath: null,
    fileIdentity: null,
    watcher: null,
    debounceTimer: null,
    watchedPaths: new Set(),
    renderRevision: 0,
    disposed: false,
  };
  sessions.set(windowId, session);
  return session;
}

function unregisterWindow(window) {
  const session = getWindowSession(window);
  if (!session) return;

  session.disposed = true;
  session.renderRevision += 1;
  sessions.delete(getWindowId(window));
}

function getWindowSession(window) {
  const windowId = getWindowId(window);
  if (windowId === undefined || windowId === null) return null;
  return sessions.get(windowId) || null;
}

function getWindowSessions() {
  return Array.from(sessions.values()).filter((session) => !session.disposed);
}

function setWindowReady(window, ready) {
  const session = getWindowSession(window);
  if (!session) return;
  session.ready = Promise.resolve(ready);
}

function getCurrentFilePath(window) {
  return getWindowSession(window)?.currentFilePath || null;
}

function reserveFile(window, filePath) {
  const session = getWindowSession(window);
  if (!session || !filePath) return null;

  const resolvedPath = resolveFilePath(filePath);
  session.currentFilePath = resolvedPath;
  session.fileIdentity = getFileIdentity(resolvedPath);
  session.renderRevision += 1;

  return {
    filePath: resolvedPath,
    revision: session.renderRevision,
    session,
  };
}

function beginRender(window, filePath) {
  const session = getWindowSession(window);
  if (
    !session ||
    session.disposed ||
    session.currentFilePath !== resolveFilePath(filePath)
  ) {
    return null;
  }

  session.renderRevision += 1;
  return session.renderRevision;
}

function isCurrentRender(window, filePath, revision) {
  const session = getWindowSession(window);
  return Boolean(
    session &&
    !session.disposed &&
    session.currentFilePath === resolveFilePath(filePath) &&
    session.renderRevision === revision,
  );
}

function clearCurrentFilePath(window) {
  const session = getWindowSession(window);
  if (!session) return;

  session.currentFilePath = null;
  session.fileIdentity = null;
  session.renderRevision += 1;
}

function findWindowSessionByFilePath(filePath) {
  if (!filePath) return null;
  const identity = getFileIdentity(filePath);

  return (
    getWindowSessions().find((session) => session.fileIdentity === identity) ||
    null
  );
}

module.exports = {
  beginRender,
  clearCurrentFilePath,
  findWindowSessionByFilePath,
  getCurrentFilePath,
  getFileIdentity,
  getWindowSession,
  getWindowSessions,
  isCurrentRender,
  registerWindow,
  reserveFile,
  resolveFilePath,
  setWindowReady,
  unregisterWindow,
};
