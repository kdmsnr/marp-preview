const createdWindows = [];
let mockLoadFileResult;
let mockNextWindowId = 1;

jest.mock('electron', () => {
  const BrowserWindow = jest.fn((options) => {
    const handlers = {};
    const webContentsHandlers = {};
    let windowOpenHandler;
    const window = {
      id: mockNextWindowId++,
      options,
      webContents: {
        on: jest.fn((event, callback) => {
          webContentsHandlers[event] = callback;
        }),
        emit: (event, ...args) => webContentsHandlers[event]?.(...args),
        setWindowOpenHandler: jest.fn((callback) => {
          windowOpenHandler = callback;
        }),
        triggerWindowOpen: (details) => windowOpenHandler?.(details),
      },
      focus: jest.fn(),
      isDestroyed: jest.fn(() => false),
      isMinimized: jest.fn(() => false),
      loadFile: jest.fn(() => mockLoadFileResult),
      on: jest.fn((event, callback) => {
        handlers[event] = callback;
      }),
      restore: jest.fn(),
      show: jest.fn(),
      emit: (event) => handlers[event]?.(),
    };
    createdWindows.push(window);
    return window;
  });

  BrowserWindow.getFocusedWindow = jest.fn();
  BrowserWindow.__getLastWindow = () =>
    createdWindows[createdWindows.length - 1];

  return {
    BrowserWindow,
    shell: {
      openExternal: jest.fn(() => Promise.resolve()),
    },
  };
});

jest.mock('../app/state', () => ({
  getWindowSession: jest.fn(),
  getWindowSessions: jest.fn(),
  registerWindow: jest.fn(),
  setWindowReady: jest.fn(),
  unregisterWindow: jest.fn(),
}));

jest.mock('../app/fileWatcher', () => ({
  stopWatching: jest.fn(),
}));

const electron = require('electron');
const state = require('../app/state');
const { stopWatching } = require('../app/fileWatcher');
const {
  createMainWindow,
  ensureMainWindow,
  getMainWindows,
  whenWindowReady,
} = require('../app/mainWindow');

describe('mainWindow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createdWindows.length = 0;
    mockNextWindowId = 1;
    mockLoadFileResult = undefined;
    electron.BrowserWindow.getFocusedWindow.mockReturnValue(null);
    state.getWindowSession.mockReturnValue(null);
    state.getWindowSessions.mockReturnValue([]);
  });

  test('creates, registers, and cleans up a browser window', () => {
    const loadPromise = Promise.resolve();
    mockLoadFileResult = loadPromise;

    const window = createMainWindow();

    expect(electron.BrowserWindow).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 800,
        height: 600,
      }),
    );
    expect(state.registerWindow).toHaveBeenCalledWith(window);
    expect(window.loadFile).toHaveBeenCalled();
    expect(state.setWindowReady).toHaveBeenCalledWith(window, loadPromise);

    window.emit('closed');

    expect(stopWatching).toHaveBeenCalledWith(window);
    expect(state.unregisterWindow).toHaveBeenCalledWith(window);
  });

  test('returns the readiness promise for the requested window', () => {
    const window = { id: 1 };
    const ready = Promise.resolve();
    state.getWindowSession.mockReturnValue({ window, ready });

    expect(whenWindowReady(window)).toBe(ready);
  });

  test('lists only usable registered windows', () => {
    const firstWindow = { isDestroyed: jest.fn(() => false) };
    const destroyedWindow = { isDestroyed: jest.fn(() => true) };
    state.getWindowSessions.mockReturnValue([
      { window: firstWindow },
      { window: destroyedWindow },
    ]);

    expect(getMainWindows()).toEqual([firstWindow]);
  });

  test('opens external top-level navigations in the default browser', () => {
    createMainWindow();

    const event = { preventDefault: jest.fn() };
    const lastWindow = electron.BrowserWindow.__getLastWindow();
    lastWindow.webContents.emit(
      'will-navigate',
      event,
      'https://example.com/docs',
    );

    expect(event.preventDefault).toHaveBeenCalled();
    expect(electron.shell.openExternal).toHaveBeenCalledWith(
      'https://example.com/docs',
    );
  });

  test('does not intercept internal file navigations', () => {
    createMainWindow();

    const event = { preventDefault: jest.fn() };
    const lastWindow = electron.BrowserWindow.__getLastWindow();
    lastWindow.webContents.emit(
      'will-navigate',
      event,
      'file:///tmp/index.html#slide-2',
    );

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(electron.shell.openExternal).not.toHaveBeenCalled();
  });

  test('opens target blank external links in the default browser', () => {
    createMainWindow();

    const lastWindow = electron.BrowserWindow.__getLastWindow();
    const result = lastWindow.webContents.triggerWindowOpen({
      url: 'mailto:author@example.com',
    });

    expect(result).toEqual({ action: 'deny' });
    expect(electron.shell.openExternal).toHaveBeenCalledWith(
      'mailto:author@example.com',
    );
  });

  test('ensureMainWindow focuses the active registered window', () => {
    const existing = {
      id: 10,
      focus: jest.fn(),
      isDestroyed: jest.fn(() => false),
      isMinimized: jest.fn(() => true),
      restore: jest.fn(),
      show: jest.fn(),
    };
    electron.BrowserWindow.getFocusedWindow.mockReturnValue(existing);
    state.getWindowSession.mockReturnValue({ window: existing });

    const window = ensureMainWindow();

    expect(window).toBe(existing);
    expect(existing.restore).toHaveBeenCalled();
    expect(existing.show).toHaveBeenCalled();
    expect(existing.focus).toHaveBeenCalled();
    expect(electron.BrowserWindow).not.toHaveBeenCalled();
  });

  test('ensureMainWindow creates a window when none are registered', () => {
    const window = ensureMainWindow();

    expect(window).toBe(electron.BrowserWindow.__getLastWindow());
    expect(electron.BrowserWindow).toHaveBeenCalledTimes(1);
  });
});
