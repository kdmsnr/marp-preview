const mockReadFile = jest.fn();
const mockShowErrorBox = jest.fn();
const mockRender = jest.fn();

const mockMainWindow = {
  webContents: { send: jest.fn() },
  setTitle: jest.fn(),
  isDestroyed: jest.fn(() => false),
};

jest.mock('fs', () => ({
  promises: {
    readFile: mockReadFile,
  },
}));

jest.mock('electron', () => ({
  dialog: {
    showErrorBox: mockShowErrorBox,
  },
}));

jest.mock('@marp-team/marp-core', () => ({
  Marp: jest.fn(() => ({
    render: mockRender,
  })),
}));

jest.mock('../app/state', () => ({
  getMainWindow: jest.fn(() => mockMainWindow),
}));

const state = require('../app/state');
const { dialog } = require('electron');
const { Marp } = require('@marp-team/marp-core');
const { renderAndSend } = require('../app/markdownRenderer');

describe('markdownRenderer', () => {
  let consoleWarnSpy;

  beforeEach(() => {
    mockReadFile.mockReset();
    mockShowErrorBox.mockReset();
    mockRender.mockReset();
    state.getMainWindow.mockClear();
    mockMainWindow.webContents.send.mockClear();
    mockMainWindow.setTitle.mockClear();
    mockMainWindow.isDestroyed.mockClear();
    mockMainWindow.isDestroyed.mockReturnValue(false);
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  test('reads markdown, renders it, and sends contents to the window', async () => {
    mockReadFile.mockResolvedValue('# Sample');
    mockRender.mockReturnValue({ html: '<h1>Sample</h1>', css: 'body{}' });

    await renderAndSend('/tmp/slides.md');

    expect(mockReadFile).toHaveBeenCalledWith('/tmp/slides.md', 'utf-8');
    expect(mockRender).toHaveBeenCalledWith('# Sample');
    expect(mockMainWindow.webContents.send).toHaveBeenCalledWith(
      'marp-rendered',
      { html: '<h1>Sample</h1>', css: 'body{}' },
    );
    expect(mockMainWindow.setTitle).toHaveBeenCalledWith('slides.md');
    expect(dialog.showErrorBox).not.toHaveBeenCalled();
  });

  test('shows an error dialog when rendering fails', async () => {
    const error = new Error('boom');
    mockReadFile.mockRejectedValue(error);

    await renderAndSend('/tmp/slides.md');

    expect(dialog.showErrorBox).toHaveBeenCalledWith(
      'Render Error',
      expect.stringContaining('boom'),
    );
    expect(mockMainWindow.webContents.send).not.toHaveBeenCalled();
  });

  test('skips sending when the window has been destroyed', async () => {
    mockReadFile.mockResolvedValue('# Deck');
    mockRender.mockReturnValue({ html: '<h1>Deck</h1>', css: 'body{}' });
    mockMainWindow.isDestroyed.mockReturnValue(true);

    await renderAndSend('/tmp/slides.md');

    expect(mockMainWindow.webContents.send).not.toHaveBeenCalled();
    expect(mockMainWindow.setTitle).not.toHaveBeenCalled();
  });

  test('constructs Marp with inline SVG enabled', () => {
    expect(Marp).toHaveBeenCalledWith({ inlineSVG: true });
  });
});
