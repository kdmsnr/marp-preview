const mockShowErrorBox = jest.fn();
const mockShowSaveDialog = jest.fn();
const mockShowMessageBox = jest.fn();

jest.mock('electron', () => ({
  dialog: {
    showErrorBox: mockShowErrorBox,
    showSaveDialog: mockShowSaveDialog,
    showMessageBox: mockShowMessageBox,
  },
}));

const mockMarpCli = jest.fn();
jest.mock('@marp-team/marp-cli', () => ({
  marpCli: mockMarpCli,
}));

const mockAccess = jest.fn();
const mockWriteFile = jest.fn();
const mockUnlink = jest.fn();
jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return {
    ...actual,
    promises: {
      ...actual.promises,
      access: mockAccess,
      writeFile: mockWriteFile,
      unlink: mockUnlink,
    },
  };
});

const mockLoadDeck = jest.fn();
jest.mock('../app/deckLoader', () => ({
  loadDeck: mockLoadDeck,
}));

jest.mock('../app/state', () => ({
  getCurrentFilePath: jest.fn(),
  getMainWindow: jest.fn(() => ({ id: 'window' })),
}));

const state = require('../app/state');
const { exportFile } = require('../app/exporter');
const path = require('path');

const enginePath = path.join(__dirname, '..', 'app', 'marpEngine.js');

describe('exporter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadDeck.mockResolvedValue({
      markdown: '# Deck',
      dependencies: ['/tmp/deck.md'],
    });
    mockWriteFile.mockResolvedValue();
    mockUnlink.mockResolvedValue();
  });

  test('shows an error when no file is open', async () => {
    state.getCurrentFilePath.mockReturnValue(null);

    await exportFile('pdf');

    expect(mockShowErrorBox).toHaveBeenCalledWith(
      'Export Error',
      'No file is currently open to export.',
    );
    expect(mockShowSaveDialog).not.toHaveBeenCalled();
  });

  test('cancels when the save dialog is dismissed', async () => {
    state.getCurrentFilePath.mockReturnValue('/tmp/deck.md');
    mockShowSaveDialog.mockResolvedValue({ canceled: true });

    await exportFile('pdf');

    expect(mockShowSaveDialog).toHaveBeenCalled();
    expect(mockMarpCli).not.toHaveBeenCalled();
  });

  test('runs the Marp CLI and reports success', async () => {
    state.getCurrentFilePath.mockReturnValue('/tmp/deck.md');
    mockShowSaveDialog.mockResolvedValue({
      canceled: false,
      filePath: '/tmp/output.pdf',
    });
    mockMarpCli.mockResolvedValue(0);
    mockAccess.mockResolvedValue();

    await exportFile('pdf');

    expect(mockMarpCli).toHaveBeenCalledWith([
      '--engine',
      enginePath,
      '--allow-local-files',
      'deck.md',
      '-o',
      '/tmp/output.pdf',
    ]);
    expect(mockAccess).toHaveBeenCalledWith(
      '/tmp/output.pdf',
      expect.any(Number),
    );
    expect(mockShowMessageBox).toHaveBeenCalledWith(
      { id: 'window' },
      expect.objectContaining({
        type: 'info',
        message: expect.stringContaining('/tmp/output.pdf'),
      }),
    );
  });

  test('exports expanded Markdown and removes the temporary input', async () => {
    state.getCurrentFilePath.mockReturnValue('/tmp/deck.md');
    mockShowSaveDialog.mockResolvedValue({
      canceled: false,
      filePath: '/tmp/output.pdf',
    });
    mockLoadDeck.mockResolvedValue({
      markdown: '# Title\n\n---\n\n# Body',
      dependencies: ['/tmp/deck.md', '/tmp/body.md'],
    });
    mockMarpCli.mockResolvedValue(0);
    mockAccess.mockResolvedValue();

    await exportFile('pdf');

    const temporaryPath = mockWriteFile.mock.calls[0][0];
    expect(temporaryPath).toMatch(/^\/tmp\/\.marp-preview-[\da-f-]+\.md$/);
    expect(mockWriteFile).toHaveBeenCalledWith(
      temporaryPath,
      '# Title\n\n---\n\n# Body',
      {
        encoding: 'utf-8',
        flag: 'wx',
      },
    );
    expect(mockMarpCli).toHaveBeenCalledWith([
      '--engine',
      enginePath,
      '--allow-local-files',
      path.basename(temporaryPath),
      '-o',
      '/tmp/output.pdf',
    ]);
    expect(mockUnlink).toHaveBeenCalledWith(temporaryPath);
  });

  test('reports failures from the Marp CLI', async () => {
    state.getCurrentFilePath.mockReturnValue('/tmp/deck.md');
    mockShowSaveDialog.mockResolvedValue({
      canceled: false,
      filePath: '/tmp/output.pdf',
    });
    mockMarpCli.mockResolvedValue(1);

    await exportFile('pdf');

    expect(mockShowErrorBox).toHaveBeenCalledWith(
      'Export Failed',
      expect.stringContaining('code 1'),
    );
  });
});
