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

jest.mock('../app/markdownRenderer', () => ({
  renderAndSend: jest.fn(),
}));

jest.mock('../app/state', () => {
  const mainWindow = {
    webContents: { send: jest.fn() },
    setTitle: jest.fn(),
    isDestroyed: jest.fn(() => false),
  };
  let watcher = null;

  const api = {
    clearWatcher: jest.fn(() => {
      watcher = null;
    }),
    getWatcher: jest.fn(() => watcher),
    setWatcher: jest.fn((newWatcher) => {
      watcher = newWatcher;
    }),
    getMainWindow: jest.fn(() => mainWindow),
    setCurrentFilePath: jest.fn(),
  };

  api.__reset = () => {
    watcher = null;
    api.clearWatcher.mockClear();
    api.getWatcher.mockClear();
    api.setWatcher.mockClear();
    api.getMainWindow.mockClear();
    api.setCurrentFilePath.mockClear();
    mainWindow.webContents.send.mockClear();
    mainWindow.setTitle.mockClear();
    mainWindow.isDestroyed.mockClear();
    mainWindow.isDestroyed.mockImplementation(() => false);
  };

  return api;
});

const chokidar = require('chokidar');
const state = require('../app/state');
const { renderAndSend } = require('../app/markdownRenderer');
const { startWatching, stopWatching } = require('../app/fileWatcher');

describe('fileWatcher', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    chokidar.__reset();
    state.__reset();
    renderAndSend.mockReset();
    renderAndSend.mockResolvedValue(['/tmp/sample.md']);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('watches the requested file and renders changes after debounce', () => {
    startWatching('/tmp/sample.md');

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

    expect(renderAndSend).toHaveBeenCalledTimes(1);
    expect(renderAndSend).toHaveBeenCalledWith('/tmp/sample.md');
  });

  test('watches included files and renders the entry file when they change', () => {
    startWatching('/tmp/deck.md', [
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

    expect(renderAndSend).toHaveBeenCalledWith('/tmp/deck.md');
  });

  test('updates watched files after the include list changes', async () => {
    renderAndSend.mockResolvedValue(['/tmp/deck.md', '/tmp/02-body.md']);
    startWatching('/tmp/deck.md', ['/tmp/deck.md', '/tmp/01-title.md']);

    const watcher = chokidar.__getWatchers()[0];
    watcher.emit('change', '/tmp/deck.md');
    jest.advanceTimersByTime(300);
    await Promise.resolve();

    expect(watcher.add).toHaveBeenCalledWith(['/tmp/02-body.md']);
    expect(watcher.unwatch).toHaveBeenCalledWith(['/tmp/01-title.md']);
  });

  test('keeps the deck open when an included file is removed', () => {
    startWatching('/tmp/deck.md', ['/tmp/deck.md', '/tmp/01-title.md']);
    const watcher = chokidar.__getWatchers()[0];

    watcher.emit('unlink', '/tmp/01-title.md');
    jest.advanceTimersByTime(300);

    expect(renderAndSend).toHaveBeenCalledWith('/tmp/deck.md');
    expect(state.setCurrentFilePath).not.toHaveBeenCalled();
    expect(watcher.close).not.toHaveBeenCalled();
  });

  test('closing a previous watcher before starting a new one', () => {
    startWatching('first.md');
    const firstWatcher = chokidar.__getWatchers()[0];

    startWatching('second.md');

    expect(firstWatcher.close).toHaveBeenCalledTimes(1);
    expect(chokidar.__getWatchers()).toHaveLength(2);
  });

  test('resetting preview state when the watched file is removed', () => {
    startWatching('deck.md');
    const watcher = chokidar.__getWatchers()[0];
    const mainWindow = state.getMainWindow();

    watcher.emit('unlink', 'deck.md');

    expect(state.setCurrentFilePath).toHaveBeenCalledWith(null);
    expect(mainWindow.webContents.send).toHaveBeenCalledWith('marp-rendered', {
      html: '',
      css: '',
    });
    expect(mainWindow.setTitle).toHaveBeenCalledWith('Marp Preview');
    expect(watcher.close).toHaveBeenCalledTimes(1);
  });

  test('stopWatching without an active watcher is a no-op', () => {
    expect(() => stopWatching()).not.toThrow();
    expect(state.clearWatcher).not.toHaveBeenCalled();
  });

  test('clears the debounce timer when watching stops', () => {
    startWatching('deck.md');
    const watcher = chokidar.__getWatchers()[0];
    watcher.emit('change', 'deck.md');

    stopWatching();
    jest.advanceTimersByTime(300);

    expect(renderAndSend).not.toHaveBeenCalled();
  });
});
