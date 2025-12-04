const createdWindows = [];

jest.mock('electron', () => {
  const BrowserWindow = jest.fn((options) => {
    const handlers = {};
    const window = {
      options,
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

  return { BrowserWindow };
});

jest.mock('../app/state', () => ({
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
    expect(state.clearMainWindow).toHaveBeenCalled();
    expect(stopWatching).toHaveBeenCalled();
  });

  test('ensureMainWindow reuses the existing instance', () => {
    const existing = { id: 'cached' };
    state.getMainWindow.mockReturnValue(existing);

    const window = ensureMainWindow();

    expect(window).toBe(existing);
    expect(electron.BrowserWindow).not.toHaveBeenCalled();
  });
});
