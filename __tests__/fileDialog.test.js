const mockShowOpenDialog = jest.fn();
const mockShowErrorBox = jest.fn();

jest.mock('electron', () => ({
  dialog: {
    showOpenDialog: mockShowOpenDialog,
    showErrorBox: mockShowErrorBox,
  },
}));

const mockEnsureMainWindow = jest.fn(() => ({ id: 'main' }));
jest.mock('../app/mainWindow', () => ({
  ensureMainWindow: mockEnsureMainWindow,
}));

const mockLoadFile = jest.fn();
jest.mock('../app/fileLoader', () => ({
  loadFile: mockLoadFile,
}));

const { ensureMainWindow } = require('../app/mainWindow');
const { loadFile } = require('../app/fileLoader');
const { openFile } = require('../app/fileDialog');

describe('fileDialog', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('opens the dialog and loads the selected file', async () => {
    mockShowOpenDialog.mockResolvedValue({
      canceled: false,
      filePaths: ['/tmp/deck.md'],
    });

    await openFile();

    expect(ensureMainWindow).toHaveBeenCalled();
    expect(mockShowOpenDialog).toHaveBeenCalledWith({ id: 'main' }, expect.any(Object));
    expect(loadFile).toHaveBeenCalledWith('/tmp/deck.md');
  });

  test('does nothing when the dialog is canceled', async () => {
    mockShowOpenDialog.mockResolvedValue({
      canceled: true,
      filePaths: ['/tmp/deck.md'],
    });

    await openFile();

    expect(loadFile).not.toHaveBeenCalled();
  });

  test('reports dialog errors', async () => {
    const error = new Error('boom');
    mockShowOpenDialog.mockRejectedValue(error);

    await openFile();

    expect(mockShowErrorBox).toHaveBeenCalledWith(
      'Dialog Error',
      expect.stringContaining('boom'),
    );
  });
});
