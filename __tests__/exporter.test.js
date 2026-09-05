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
}));

const state = require('../app/state');
const { exportFile } = require('../app/exporter');
const path = require('path');
const { setImmediate } = require('timers');

const enginePath = path.join(__dirname, '..', 'app', 'marpEngine.js');

describe('exporter', () => {
  const targetWindow = { id: 'target-window' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadDeck.mockResolvedValue({
      markdown: '# Deck',
      dependencies: ['/tmp/deck.md'],
    });
    mockWriteFile.mockResolvedValue();
    mockUnlink.mockResolvedValue();
    mockShowMessageBox.mockResolvedValue();
  });

  test('shows an error when no file is open', async () => {
    state.getCurrentFilePath.mockReturnValue(null);

    await exportFile(targetWindow, 'pdf');

    expect(state.getCurrentFilePath).toHaveBeenCalledWith(targetWindow);
    expect(mockShowErrorBox).toHaveBeenCalledWith(
      'Export Error',
      'No file is currently open to export.',
    );
    expect(mockShowSaveDialog).not.toHaveBeenCalled();
  });

  test('cancels when the save dialog is dismissed', async () => {
    state.getCurrentFilePath.mockReturnValue('/tmp/deck.md');
    mockShowSaveDialog.mockResolvedValue({ canceled: true });

    await exportFile(targetWindow, 'pdf');

    expect(mockShowSaveDialog).toHaveBeenCalledWith(
      targetWindow,
      expect.objectContaining({ defaultPath: 'deck.pdf' }),
    );
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

    await exportFile(targetWindow, 'pdf');

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
      targetWindow,
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

    await exportFile(targetWindow, 'pdf');

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

    await exportFile(targetWindow, 'pdf');

    expect(mockShowErrorBox).toHaveBeenCalledWith(
      'Export Failed',
      expect.stringContaining('code 1'),
    );
  });

  test('uses an unparented confirmation if the window closes during export', async () => {
    const closingWindow = {
      id: 'closing-window',
      isDestroyed: jest.fn().mockReturnValueOnce(false).mockReturnValue(true),
    };
    state.getCurrentFilePath.mockReturnValue('/tmp/deck.md');
    mockShowSaveDialog.mockResolvedValue({
      canceled: false,
      filePath: '/tmp/output.pdf',
    });
    mockMarpCli.mockResolvedValue(0);
    mockAccess.mockResolvedValue();

    await exportFile(closingWindow, 'pdf');

    expect(mockShowSaveDialog).toHaveBeenCalledWith(
      closingWindow,
      expect.any(Object),
    );
    expect(mockShowMessageBox).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Export Successful',
      }),
    );
  });

  test('does not turn a confirmation failure into an export failure', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const error = new Error('window closed');
    state.getCurrentFilePath.mockReturnValue('/tmp/deck.md');
    mockShowSaveDialog.mockResolvedValue({
      canceled: false,
      filePath: '/tmp/output.pdf',
    });
    mockMarpCli.mockResolvedValue(0);
    mockAccess.mockResolvedValue();
    mockShowMessageBox.mockRejectedValue(error);

    await expect(exportFile(targetWindow, 'pdf')).resolves.toBeUndefined();

    expect(mockShowErrorBox).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to show the export confirmation:',
      error,
    );
    consoleError.mockRestore();
  });

  test('serializes simultaneous Marp CLI exports', async () => {
    const firstWindow = {
      id: 'first-window',
      filePath: '/tmp/first.md',
      outputPath: '/tmp/first.pdf',
    };
    const secondWindow = {
      id: 'second-window',
      filePath: path.join(process.cwd(), 'second.md'),
      outputPath: '/tmp/second.pdf',
    };
    let finishFirstExport;
    const firstCliRun = new Promise((resolve) => {
      finishFirstExport = resolve;
    });

    state.getCurrentFilePath.mockImplementation((window) => window.filePath);
    mockShowSaveDialog.mockImplementation(async (window) => ({
      canceled: false,
      filePath: window.outputPath,
    }));
    mockLoadDeck.mockImplementation(async (input) => ({
      markdown: '# Deck',
      dependencies: [input],
    }));
    mockMarpCli
      .mockImplementationOnce(() => firstCliRun)
      .mockResolvedValueOnce(0);
    mockAccess.mockResolvedValue();

    const firstExport = exportFile(firstWindow, 'pdf');
    const secondExport = exportFile(secondWindow, 'pdf');
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockMarpCli).toHaveBeenCalledTimes(1);

    finishFirstExport(0);
    await Promise.all([firstExport, secondExport]);

    expect(mockMarpCli).toHaveBeenCalledTimes(2);
    expect(mockShowMessageBox).toHaveBeenCalledWith(
      firstWindow,
      expect.any(Object),
    );
    expect(mockShowMessageBox).toHaveBeenCalledWith(
      secondWindow,
      expect.any(Object),
    );
  });
});
