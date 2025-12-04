jest.mock('../app/state', () => ({
  setCurrentFilePath: jest.fn(),
}));

jest.mock('../app/markdownRenderer', () => ({
  renderAndSend: jest.fn(),
}));

jest.mock('../app/fileWatcher', () => ({
  startWatching: jest.fn(),
}));

jest.mock('../app/recentFiles', () => ({
  addRecentFile: jest.fn(),
}));

const state = require('../app/state');
const { renderAndSend } = require('../app/markdownRenderer');
const { startWatching } = require('../app/fileWatcher');
const { addRecentFile } = require('../app/recentFiles');
const { loadFile } = require('../app/fileLoader');

describe('fileLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns false when no file path is provided', () => {
    expect(loadFile(undefined)).toBe(false);
    expect(state.setCurrentFilePath).not.toHaveBeenCalled();
  });

  test('loads a file and wires dependencies', () => {
    const filePath = '/tmp/deck.md';
    const loaded = loadFile(filePath);

    expect(loaded).toBe(true);
    expect(state.setCurrentFilePath).toHaveBeenCalledWith(filePath);
    expect(renderAndSend).toHaveBeenCalledWith(filePath);
    expect(startWatching).toHaveBeenCalledWith(filePath);
    expect(addRecentFile).toHaveBeenCalledWith(filePath);
  });
});
