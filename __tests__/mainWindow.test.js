const createdWindows = [];

jest.mock('electron', () => {
  const BrowserWindow = jest.fn((options) => {
    const handlers = {};
    const webContentsHandlers = {};
    let windowOpenHandler;
    const window = {
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
      loadFile: jest.fn(),
      on: jest.fn((event, callback) => {
        handlers[event] = callback;
      }),
      emit: (event) => handlers[event]?.(),
    };
    createdWindows.push(window);
    return window;
  });

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
  clearCurrentFilePath: jest.fn(),
  clearMainWindow: jest.fn(),
  getMainWindow: jest.fn(),
  setMainWindow: jest.fn(),
}));

const mockStopWatching = jest.fn();
jest.mock('../app/fileWatcher', () => ({
  stopWatching: jest.fn(() => mockStopWatching()),
}));

const electron = require('electron');
const state = require('../app/state');
const { stopWatching } = require('../app/fileWatcher');
const { createMainWindow, ensureMainWindow } = require('../app/mainWindow');

describe('mainWindow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createdWindows.length = 0;
    state.getMainWindow.mockReset();
  });

  test('creates the browser window and registers cleanup', () => {
    state.getMainWindow.mockReturnValue(null);

    const window = createMainWindow();

    expect(electron.BrowserWindow).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 800,
        height: 600,
      }),
    );
    expect(window.loadFile).toHaveBeenCalled();
    const lastWindow = electron.BrowserWindow.__getLastWindow();
    lastWindow.emit('closed');
    expect(state.clearCurrentFilePath).toHaveBeenCalled();
    expect(state.clearMainWindow).toHaveBeenCalled();
    expect(stopWatching).toHaveBeenCalled();
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

  test('ensureMainWindow reuses the existing instance', () => {
    const existing = { id: 'cached' };
    state.getMainWindow.mockReturnValue(existing);

    const window = ensureMainWindow();

    expect(window).toBe(existing);
    expect(electron.BrowserWindow).not.toHaveBeenCalled();
  });
});
