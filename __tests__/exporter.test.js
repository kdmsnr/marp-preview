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
jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return {
    ...actual,
    promises: {
      ...actual.promises,
      access: mockAccess,
    },
  };
});

jest.mock('../app/state', () => ({
  getCurrentFilePath: jest.fn(),
  getMainWindow: jest.fn(() => ({ id: 'window' })),
}));

const state = require('../app/state');
const { exportFile } = require('../app/exporter');

describe('exporter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    expect(mockMarpCli).toHaveBeenCalledWith(['/tmp/deck.md', '-o', '/tmp/output.pdf']);
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
