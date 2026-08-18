jest.mock('chokidar', () => {
  const { EventEmitter } = require('events');
  const watchers = [];
  const watch = jest.fn(() => {
    const emitter = new EventEmitter();
    emitter.close = jest.fn(() => emitter.removeAllListeners());
    emitter.add = jest.fn();
    emitter.unwatch = jest.fn();
    watchers.push(emitter);
    return emitter;
  });

  return {
    watch,
    __getWatchers: () => watchers,
    __reset: () => {
      watch.mockClear();
      watchers.splice(0, watchers.length);
    },
  };
});

const mockShowErrorBox = jest.fn();
jest.mock('electron', () => ({
  dialog: {
    showErrorBox: mockShowErrorBox,
  },
}));

jest.mock('../app/markdownRenderer', () => ({
  renderAndSend: jest.fn(),
}));

jest.mock('../app/state', () => {
  const sessions = new Map();

  const api = {
    beginRender: jest.fn((window, filePath) => {
      const session = sessions.get(window);
      if (
        !session ||
        session.disposed ||
        session.currentFilePath !== filePath
      ) {
        return null;
      }

      session.renderRevision += 1;
      return session.renderRevision;
    }),
    clearCurrentFilePath: jest.fn((window) => {
      const session = sessions.get(window);
      if (!session) return;
      session.currentFilePath = null;
      session.renderRevision += 1;
    }),
    getWindowSession: jest.fn((window) => sessions.get(window) || null),
    isCurrentRender: jest.fn((window, filePath, revision) => {
      const session = sessions.get(window);
      return Boolean(
        session &&
        !session.disposed &&
        session.currentFilePath === filePath &&
        session.renderRevision === revision,
      );
    }),
  };

  api.__register = (window, filePath) => {
    const session = {
      window,
      currentFilePath: filePath,
      watcher: null,
      debounceTimer: null,
      watchedPaths: new Set(),
      renderRevision: 0,
      disposed: false,
    };
    sessions.set(window, session);
    return session;
  };

  api.__reset = () => {
    sessions.clear();
    api.beginRender.mockClear();
    api.clearCurrentFilePath.mockClear();
    api.getWindowSession.mockClear();
    api.isCurrentRender.mockClear();
  };

  return api;
});

const chokidar = require('chokidar');
const { dialog } = require('electron');
const state = require('../app/state');
const { renderAndSend } = require('../app/markdownRenderer');
const { startWatching, stopWatching } = require('../app/fileWatcher');

function createWindow(id) {
  return {
    id,
    webContents: { send: jest.fn() },
    setTitle: jest.fn(),
    setRepresentedFilename: jest.fn(),
    isDestroyed: jest.fn(() => false),
  };
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('fileWatcher', () => {
  let firstWindow;
  let secondWindow;

  beforeEach(() => {
    jest.useFakeTimers();
    firstWindow = createWindow(1);
    secondWindow = createWindow(2);
    chokidar.__reset();
    state.__reset();
    mockShowErrorBox.mockReset();
    renderAndSend.mockReset();
    renderAndSend.mockResolvedValue(['/tmp/sample.md']);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders a changed file in its window with a new revision', () => {
    state.__register(firstWindow, '/tmp/sample.md');
    startWatching(firstWindow, '/tmp/sample.md');

    expect(chokidar.watch).toHaveBeenCalledWith(
      ['/tmp/sample.md'],
      expect.objectContaining({
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: expect.objectContaining({
          stabilityThreshold: 300,
          pollInterval: 100,
        }),
      }),
    );

    const watcher = chokidar.__getWatchers()[0];
    watcher.emit('change', '/tmp/sample.md');
    jest.advanceTimersByTime(300);

    expect(state.beginRender).toHaveBeenCalledWith(
      firstWindow,
      '/tmp/sample.md',
    );
    expect(renderAndSend).toHaveBeenCalledWith(
      firstWindow,
      '/tmp/sample.md',
      1,
    );
  });

  test('watches included files and renders the entry file when they change', () => {
    state.__register(firstWindow, '/tmp/deck.md');
    startWatching(firstWindow, '/tmp/deck.md', [
      '/tmp/deck.md',
      '/tmp/01-title.md',
      '/tmp/02-body.md',
    ]);

    expect(chokidar.watch).toHaveBeenCalledWith(
      ['/tmp/deck.md', '/tmp/01-title.md', '/tmp/02-body.md'],
      expect.any(Object),
    );

    const watcher = chokidar.__getWatchers()[0];
    watcher.emit('change', '/tmp/02-body.md');
    jest.advanceTimersByTime(300);

    expect(renderAndSend).toHaveBeenCalledWith(firstWindow, '/tmp/deck.md', 1);
  });

  test('updates watched files after the current render changes includes', async () => {
    state.__register(firstWindow, '/tmp/deck.md');
    renderAndSend.mockResolvedValue(['/tmp/deck.md', '/tmp/02-body.md']);
    startWatching(firstWindow, '/tmp/deck.md', [
      '/tmp/deck.md',
      '/tmp/01-title.md',
    ]);

    const watcher = chokidar.__getWatchers()[0];
    watcher.emit('change', '/tmp/deck.md');
    jest.advanceTimersByTime(300);
    await flushMicrotasks();

    expect(watcher.add).toHaveBeenCalledWith(['/tmp/02-body.md']);
    expect(watcher.unwatch).toHaveBeenCalledWith(['/tmp/01-title.md']);
  });

  test('ignores include paths returned by an older render revision', async () => {
    state.__register(firstWindow, '/tmp/deck.md');
    let finishOlderRender;
    renderAndSend
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishOlderRender = resolve;
          }),
      )
      .mockResolvedValueOnce(['/tmp/deck.md', '/tmp/current.md']);
    startWatching(firstWindow, '/tmp/deck.md', [
      '/tmp/deck.md',
      '/tmp/initial.md',
    ]);

    const watcher = chokidar.__getWatchers()[0];
    watcher.emit('change', '/tmp/deck.md');
    jest.advanceTimersByTime(300);
    watcher.emit('change', '/tmp/deck.md');
    jest.advanceTimersByTime(300);
    await flushMicrotasks();

    expect(watcher.add).toHaveBeenCalledWith(['/tmp/current.md']);
    expect(watcher.unwatch).toHaveBeenCalledWith(['/tmp/initial.md']);
    watcher.add.mockClear();
    watcher.unwatch.mockClear();

    finishOlderRender(['/tmp/deck.md', '/tmp/stale.md']);
    await flushMicrotasks();

    expect(watcher.add).not.toHaveBeenCalled();
    expect(watcher.unwatch).not.toHaveBeenCalled();
  });

  test('keeps the deck open when an included file is removed', () => {
    state.__register(firstWindow, '/tmp/deck.md');
    startWatching(firstWindow, '/tmp/deck.md', [
      '/tmp/deck.md',
      '/tmp/01-title.md',
    ]);
    const watcher = chokidar.__getWatchers()[0];

    watcher.emit('unlink', '/tmp/01-title.md');
    jest.advanceTimersByTime(300);

    expect(renderAndSend).toHaveBeenCalledWith(firstWindow, '/tmp/deck.md', 1);
    expect(state.clearCurrentFilePath).not.toHaveBeenCalled();
    expect(watcher.close).not.toHaveBeenCalled();
  });

  test('keeps watchers and debounce state isolated between two windows', () => {
    state.__register(firstWindow, '/tmp/first.md');
    state.__register(secondWindow, '/tmp/second.md');
    startWatching(firstWindow, '/tmp/first.md');
    startWatching(secondWindow, '/tmp/second.md');
    const [firstWatcher, secondWatcher] = chokidar.__getWatchers();

    expect(firstWatcher.close).not.toHaveBeenCalled();
    firstWatcher.emit('change', '/tmp/first.md');
    secondWatcher.emit('change', '/tmp/second.md');
    stopWatching(firstWindow);
    jest.advanceTimersByTime(300);

    expect(firstWatcher.close).toHaveBeenCalledTimes(1);
    expect(secondWatcher.close).not.toHaveBeenCalled();
    expect(renderAndSend).toHaveBeenCalledTimes(1);
    expect(renderAndSend).toHaveBeenCalledWith(
      secondWindow,
      '/tmp/second.md',
      1,
    );
  });

  test('closes only the previous watcher for the same window', () => {
    const session = state.__register(firstWindow, '/tmp/first.md');
    startWatching(firstWindow, '/tmp/first.md');
    const firstWatcher = chokidar.__getWatchers()[0];

    session.currentFilePath = '/tmp/second.md';
    startWatching(firstWindow, '/tmp/second.md');

    expect(firstWatcher.close).toHaveBeenCalledTimes(1);
    expect(chokidar.__getWatchers()).toHaveLength(2);
  });

  test('stops only the watcher that emits an error', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    state.__register(firstWindow, '/tmp/first.md');
    state.__register(secondWindow, '/tmp/second.md');
    startWatching(firstWindow, '/tmp/first.md');
    startWatching(secondWindow, '/tmp/second.md');
    const [firstWatcher, secondWatcher] = chokidar.__getWatchers();
    const error = new Error('watch limit reached');

    firstWatcher.emit('error', error);

    expect(consoleError).toHaveBeenCalledWith('Failed to watch files:', error);
    expect(dialog.showErrorBox).toHaveBeenCalledWith(
      'File Watch Error',
      expect.stringContaining('watch limit reached'),
    );
    expect(firstWatcher.close).toHaveBeenCalledTimes(1);
    expect(secondWatcher.close).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  test('resets only the window whose entry file is removed', () => {
    state.__register(firstWindow, '/tmp/first.md');
    state.__register(secondWindow, '/tmp/second.md');
    startWatching(firstWindow, '/tmp/first.md');
    startWatching(secondWindow, '/tmp/second.md');
    const [firstWatcher, secondWatcher] = chokidar.__getWatchers();

    firstWatcher.emit('unlink', '/tmp/first.md');

    expect(state.clearCurrentFilePath).toHaveBeenCalledTimes(1);
    expect(state.clearCurrentFilePath).toHaveBeenCalledWith(firstWindow);
    expect(firstWindow.webContents.send).toHaveBeenCalledWith('marp-rendered', {
      html: '',
      css: '',
    });
    expect(firstWindow.setTitle).toHaveBeenCalledWith('Marp Preview');
    expect(firstWindow.setRepresentedFilename).toHaveBeenCalledWith('');
    expect(firstWatcher.close).toHaveBeenCalledTimes(1);
    expect(secondWindow.webContents.send).not.toHaveBeenCalled();
    expect(secondWatcher.close).not.toHaveBeenCalled();
  });

  test('stopWatching with an unregistered window is a no-op', () => {
    expect(() => stopWatching(firstWindow)).not.toThrow();
    expect(chokidar.watch).not.toHaveBeenCalled();
  });
});
