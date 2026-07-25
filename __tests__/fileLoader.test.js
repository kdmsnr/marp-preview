jest.mock('../app/state', () => ({
  getCurrentFilePath: jest.fn(),
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
    renderAndSend.mockResolvedValue(['/tmp/deck.md', '/tmp/part.md']);
  });

  test('returns false when no file path is provided', async () => {
    await expect(loadFile(undefined)).resolves.toBe(false);
    expect(state.setCurrentFilePath).not.toHaveBeenCalled();
  });

  test('loads a file and wires dependencies', async () => {
    const filePath = '/tmp/deck.md';
    state.getCurrentFilePath.mockReturnValue(filePath);

    await expect(loadFile(filePath)).resolves.toBe(true);
    expect(state.setCurrentFilePath).toHaveBeenCalledWith(filePath);
    expect(renderAndSend).toHaveBeenCalledWith(filePath);
    expect(startWatching).toHaveBeenCalledWith(filePath, [
      '/tmp/deck.md',
      '/tmp/part.md',
    ]);
    expect(addRecentFile).toHaveBeenCalledWith(filePath);
  });

  test('does not replace the watcher when another file opens first', async () => {
    const filePath = '/tmp/deck.md';
    state.getCurrentFilePath.mockReturnValue('/tmp/other.md');

    await loadFile(filePath);

    expect(startWatching).not.toHaveBeenCalled();
  });
});
