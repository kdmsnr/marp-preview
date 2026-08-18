jest.mock('../app/state', () => {
  const sessions = new Map();

  const api = {
    getWindowSession: jest.fn((window) => sessions.get(window) || null),
    isCurrentRender: jest.fn((window, filePath, revision) => {
      const session = sessions.get(window);
      return Boolean(
        session &&
        session.currentFilePath === filePath &&
        session.renderRevision === revision,
      );
    }),
    reserveFile: jest.fn((window, filePath) => {
      const session = sessions.get(window);
      if (!session) return null;

      session.currentFilePath = filePath;
      session.renderRevision += 1;
      return {
        filePath,
        revision: session.renderRevision,
        session,
      };
    }),
  };

  api.__register = (window, ready = Promise.resolve()) => {
    const session = {
      currentFilePath: null,
      ready,
      renderRevision: 0,
    };
    sessions.set(window, session);
    return session;
  };

  api.__reset = () => {
    sessions.clear();
    api.getWindowSession.mockClear();
    api.isCurrentRender.mockClear();
    api.reserveFile.mockClear();
  };

  return api;
});

jest.mock('../app/markdownRenderer', () => ({
  renderAndSend: jest.fn(),
}));

jest.mock('../app/fileWatcher', () => ({
  startWatching: jest.fn(),
  stopWatching: jest.fn(),
}));

jest.mock('../app/recentFiles', () => ({
  addRecentFile: jest.fn(),
}));

const state = require('../app/state');
const { renderAndSend } = require('../app/markdownRenderer');
const { startWatching, stopWatching } = require('../app/fileWatcher');
const { addRecentFile } = require('../app/recentFiles');
const { loadFile } = require('../app/fileLoader');

describe('fileLoader', () => {
  const firstWindow = { id: 1 };
  const secondWindow = { id: 2 };

  beforeEach(() => {
    jest.clearAllMocks();
    state.__reset();
    renderAndSend.mockResolvedValue(['/tmp/deck.md', '/tmp/part.md']);
  });

  test('returns false without both a registered window and a file path', async () => {
    state.__register(firstWindow);

    await expect(loadFile(undefined, '/tmp/deck.md')).resolves.toBe(false);
    await expect(loadFile(firstWindow, undefined)).resolves.toBe(false);
    await expect(loadFile(secondWindow, '/tmp/deck.md')).resolves.toBe(false);

    expect(state.reserveFile).not.toHaveBeenCalled();
    expect(stopWatching).not.toHaveBeenCalled();
  });

  test('loads two files into their requested windows independently', async () => {
    state.__register(firstWindow);
    state.__register(secondWindow);
    renderAndSend.mockImplementation(async (_window, filePath) => [
      filePath,
      `${filePath}.part`,
    ]);

    await Promise.all([
      loadFile(firstWindow, '/tmp/first.md'),
      loadFile(secondWindow, '/tmp/second.md'),
    ]);

    expect(stopWatching).toHaveBeenCalledWith(firstWindow);
    expect(stopWatching).toHaveBeenCalledWith(secondWindow);
    expect(renderAndSend).toHaveBeenCalledWith(firstWindow, '/tmp/first.md', 1);
    expect(renderAndSend).toHaveBeenCalledWith(
      secondWindow,
      '/tmp/second.md',
      1,
    );
    expect(startWatching).toHaveBeenCalledWith(firstWindow, '/tmp/first.md', [
      '/tmp/first.md',
      '/tmp/first.md.part',
    ]);
    expect(startWatching).toHaveBeenCalledWith(secondWindow, '/tmp/second.md', [
      '/tmp/second.md',
      '/tmp/second.md.part',
    ]);
    expect(addRecentFile).toHaveBeenCalledWith('/tmp/first.md');
    expect(addRecentFile).toHaveBeenCalledWith('/tmp/second.md');
  });

  test('does not render a reservation superseded while its window becomes ready', async () => {
    let markReady;
    const ready = new Promise((resolve) => {
      markReady = resolve;
    });
    const session = state.__register(firstWindow, ready);
    const loading = loadFile(firstWindow, '/tmp/old.md');

    session.currentFilePath = '/tmp/new.md';
    session.renderRevision += 1;
    markReady();

    await expect(loading).resolves.toBe(false);
    expect(renderAndSend).not.toHaveBeenCalled();
    expect(startWatching).not.toHaveBeenCalled();
    expect(addRecentFile).not.toHaveBeenCalled();
  });

  test('does not attach a watcher for a render superseded in the same window', async () => {
    const session = state.__register(firstWindow);
    let finishRender;
    renderAndSend.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishRender = resolve;
        }),
    );

    const loading = loadFile(firstWindow, '/tmp/old.md');
    await Promise.resolve();
    session.currentFilePath = '/tmp/new.md';
    session.renderRevision += 1;
    finishRender(['/tmp/old.md']);

    await expect(loading).resolves.toBe(true);
    expect(startWatching).not.toHaveBeenCalled();
  });
});
