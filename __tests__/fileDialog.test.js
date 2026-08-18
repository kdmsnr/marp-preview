const mockShowOpenDialog = jest.fn();
const mockShowErrorBox = jest.fn();

jest.mock('electron', () => ({
  dialog: {
    showOpenDialog: mockShowOpenDialog,
    showErrorBox: mockShowErrorBox,
  },
}));

const mockCreateMainWindow = jest.fn();
const mockEnsureMainWindow = jest.fn();
const mockFocusWindow = jest.fn();
const mockGetMainWindows = jest.fn();
jest.mock('../app/mainWindow', () => ({
  createMainWindow: mockCreateMainWindow,
  ensureMainWindow: mockEnsureMainWindow,
  focusWindow: mockFocusWindow,
  getMainWindows: mockGetMainWindows,
}));

const mockClearCurrentFilePath = jest.fn();
const mockFindWindowSessionByFilePath = jest.fn();
const mockGetCurrentFilePath = jest.fn();
const mockGetFileIdentity = jest.fn();
const mockGetWindowSession = jest.fn();
const mockReserveFile = jest.fn();
jest.mock('../app/state', () => ({
  clearCurrentFilePath: mockClearCurrentFilePath,
  findWindowSessionByFilePath: mockFindWindowSessionByFilePath,
  getCurrentFilePath: mockGetCurrentFilePath,
  getFileIdentity: mockGetFileIdentity,
  getWindowSession: mockGetWindowSession,
  reserveFile: mockReserveFile,
}));

const mockLoadFile = jest.fn();
jest.mock('../app/fileLoader', () => ({
  loadFile: mockLoadFile,
}));

const { openFile, openFilePath, openFiles } = require('../app/fileDialog');

describe('fileDialog', () => {
  let consoleErrorSpy;
  let nextWindowId;
  let windows;
  let sessions;

  function addWindow(currentFilePath = null) {
    const window = {
      id: nextWindowId++,
      isDestroyed: jest.fn(() => false),
    };
    const session = {
      window,
      currentFilePath,
      fileIdentity: currentFilePath,
      renderRevision: 0,
    };
    windows.push(window);
    sessions.set(window, session);
    return window;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    nextWindowId = 1;
    windows = [];
    sessions = new Map();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockGetMainWindows.mockImplementation(() => windows);
    mockGetWindowSession.mockImplementation(
      (window) => sessions.get(window) || null,
    );
    mockGetCurrentFilePath.mockImplementation(
      (window) => sessions.get(window)?.currentFilePath || null,
    );
    mockGetFileIdentity.mockImplementation((filePath) => filePath);
    mockFindWindowSessionByFilePath.mockImplementation((filePath) =>
      Array.from(sessions.values()).find(
        (session) => session.fileIdentity === filePath,
      ),
    );
    mockReserveFile.mockImplementation((window, filePath) => {
      const session = sessions.get(window);
      if (!session) return null;
      session.currentFilePath = filePath;
      session.fileIdentity = filePath;
      session.renderRevision += 1;
      return {
        filePath,
        revision: session.renderRevision,
        session,
      };
    });
    mockClearCurrentFilePath.mockImplementation((window) => {
      const session = sessions.get(window);
      if (!session) return;
      session.currentFilePath = null;
      session.fileIdentity = null;
    });
    mockCreateMainWindow.mockImplementation(() => addWindow());
    mockEnsureMainWindow.mockImplementation(
      () => windows[0] || mockCreateMainWindow(),
    );
    mockLoadFile.mockResolvedValue(true);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('loads multiple selections into an empty window and new windows', async () => {
    const ownerWindow = addWindow();
    mockShowOpenDialog.mockResolvedValue({
      canceled: false,
      filePaths: ['/tmp/first.md', '/tmp/second.md'],
    });

    const result = await openFile(ownerWindow);

    expect(mockEnsureMainWindow).not.toHaveBeenCalled();
    expect(mockShowOpenDialog).toHaveBeenCalledWith(
      ownerWindow,
      expect.objectContaining({
        properties: ['openFile', 'multiSelections'],
      }),
    );
    expect(mockCreateMainWindow).toHaveBeenCalledTimes(1);
    expect(mockLoadFile).toHaveBeenNthCalledWith(
      1,
      ownerWindow,
      '/tmp/first.md',
    );
    expect(mockLoadFile).toHaveBeenNthCalledWith(
      2,
      windows[1],
      '/tmp/second.md',
    );
    expect(result).toEqual([ownerWindow, windows[1]]);
  });

  test('reuses another empty window before creating a new one', async () => {
    const occupiedWindow = addWindow('/tmp/open.md');
    const emptyWindow = addWindow();

    const result = await openFiles(occupiedWindow, ['/tmp/new.md']);

    expect(mockLoadFile).toHaveBeenCalledWith(emptyWindow, '/tmp/new.md');
    expect(mockCreateMainWindow).not.toHaveBeenCalled();
    expect(result).toEqual([emptyWindow]);
  });

  test('focuses a window when the requested file is already open', async () => {
    const preferredWindow = addWindow();
    const existingWindow = addWindow('/tmp/deck.md');

    const result = await openFilePath('/tmp/deck.md', preferredWindow);

    expect(mockFocusWindow).toHaveBeenCalledWith(existingWindow);
    expect(mockLoadFile).not.toHaveBeenCalled();
    expect(mockCreateMainWindow).not.toHaveBeenCalled();
    expect(result).toEqual([existingWindow]);
  });

  test('deduplicates repeated paths in a multi-file request', async () => {
    const emptyWindow = addWindow();

    await openFiles(emptyWindow, ['/tmp/deck.md', '/tmp/deck.md', null]);

    expect(mockLoadFile).toHaveBeenCalledTimes(1);
    expect(mockCreateMainWindow).not.toHaveBeenCalled();
  });

  test('uses an ensured window as the dialog owner', async () => {
    const ownerWindow = addWindow();
    mockEnsureMainWindow.mockReturnValue(ownerWindow);
    mockShowOpenDialog.mockResolvedValue({
      canceled: true,
      filePaths: [],
    });

    await expect(openFile()).resolves.toEqual([]);

    expect(mockEnsureMainWindow).toHaveBeenCalled();
    expect(mockShowOpenDialog).toHaveBeenCalledWith(
      ownerWindow,
      expect.any(Object),
    );
    expect(mockLoadFile).not.toHaveBeenCalled();
  });

  test('reports dialog errors', async () => {
    const ownerWindow = addWindow();
    const error = new Error('boom');
    mockShowOpenDialog.mockRejectedValue(error);

    await expect(openFile(ownerWindow)).resolves.toEqual([]);

    expect(mockShowErrorBox).toHaveBeenCalledWith(
      'Dialog Error',
      expect.stringContaining('boom'),
    );
  });
});
