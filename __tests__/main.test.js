function createDeferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

function loadMain() {
  jest.resetModules();

  const ready = createDeferred();
  const handlers = {};
  const app = {
    getPath: jest.fn(() => '/tmp/marp-preview-user-data'),
    on: jest.fn((eventName, handler) => {
      handlers[eventName] = handler;
      return app;
    }),
    quit: jest.fn(),
    whenReady: jest.fn(() => ready.promise),
  };
  const electron = {
    app,
    Menu: {
      setApplicationMenu: jest.fn(),
    },
    dialog: {
      showErrorBox: jest.fn(),
    },
  };
  const mainWindow = {
    createMainWindow: jest.fn(),
    ensureMainWindow: jest.fn(),
    getFocusedWindow: jest.fn(() => null),
  };
  const menu = {
    createApplicationMenu: jest.fn((options) => ({ options })),
  };
  const fileDialog = {
    openFile: jest.fn().mockResolvedValue([]),
    openFilePath: jest.fn().mockResolvedValue([]),
    openFiles: jest.fn().mockResolvedValue([]),
  };
  const exporter = {
    exportFile: jest.fn().mockResolvedValue(),
  };
  const clipboardImage = {
    pasteClipboardImage: jest.fn().mockResolvedValue(),
  };
  const windowActions = {
    setAlwaysOnTop: jest.fn(),
  };
  const recentFiles = {
    clearRecentFiles: jest.fn(),
    getRecentFiles: jest.fn(() => []),
    initializeRecentFiles: jest.fn(),
    onRecentFilesChange: jest.fn(),
    removeRecentFile: jest.fn(),
  };

  jest.doMock('electron', () => electron);
  jest.doMock('../app/mainWindow', () => mainWindow);
  jest.doMock('../app/menu', () => menu);
  jest.doMock('../app/fileDialog', () => fileDialog);
  jest.doMock('../app/exporter', () => exporter);
  jest.doMock('../app/clipboardImage', () => clipboardImage);
  jest.doMock('../app/windowActions', () => windowActions);
  jest.doMock('../app/recentFiles', () => recentFiles);

  require('../main');

  return {
    app,
    electron,
    fileDialog,
    handlers,
    mainWindow,
    menu,
    recentFiles,
    async becomeReady() {
      ready.resolve();
      await ready.promise;
      await Promise.resolve();
    },
  };
}

describe('main process lifecycle', () => {
  test('opens all macOS files queued before ready without a blank window', async () => {
    const context = loadMain();
    const firstEvent = { preventDefault: jest.fn() };
    const secondEvent = { preventDefault: jest.fn() };

    context.handlers['open-file'](firstEvent, '/tmp/first.md');
    context.handlers['open-file'](secondEvent, '/tmp/second.md');
    await context.becomeReady();

    expect(firstEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(secondEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(context.fileDialog.openFiles).toHaveBeenCalledTimes(1);
    expect(context.fileDialog.openFiles).toHaveBeenCalledWith(null, [
      '/tmp/first.md',
      '/tmp/second.md',
    ]);
    expect(context.mainWindow.createMainWindow).not.toHaveBeenCalled();
    expect(context.fileDialog.openFilePath).not.toHaveBeenCalled();
  });

  test('creates exactly one blank window when ready without pending files', async () => {
    const context = loadMain();

    await context.becomeReady();

    expect(context.mainWindow.createMainWindow).toHaveBeenCalledTimes(1);
    expect(context.fileDialog.openFiles).not.toHaveBeenCalled();
  });

  test('routes open-file events received after ready to the focused window', async () => {
    const context = loadMain();
    const focusedWindow = { id: 'focused-window' };
    const event = { preventDefault: jest.fn() };
    context.mainWindow.getFocusedWindow.mockReturnValue(focusedWindow);
    await context.becomeReady();

    context.handlers['open-file'](event, '/tmp/after-ready.md');

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(context.fileDialog.openFilePath).toHaveBeenCalledTimes(1);
    expect(context.fileDialog.openFilePath).toHaveBeenCalledWith(
      '/tmp/after-ready.md',
      focusedWindow,
    );
  });

  test('ensures a main window when the app is activated', () => {
    const context = loadMain();

    context.handlers.activate();

    expect(context.mainWindow.ensureMainWindow).toHaveBeenCalledTimes(1);
  });

  test('keeps macOS alive and quits other platforms after all windows close', () => {
    const context = loadMain();
    const platformDescriptor = Object.getOwnPropertyDescriptor(
      process,
      'platform',
    );

    try {
      Object.defineProperty(process, 'platform', {
        ...platformDescriptor,
        value: 'darwin',
      });
      context.handlers['window-all-closed']();
      expect(context.app.quit).not.toHaveBeenCalled();

      Object.defineProperty(process, 'platform', {
        ...platformDescriptor,
        value: 'linux',
      });
      context.handlers['window-all-closed']();
      expect(context.app.quit).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(process, 'platform', platformDescriptor);
    }
  });

  test('refreshes the application menu when a window gains focus', async () => {
    const context = loadMain();
    context.recentFiles.getRecentFiles
      .mockReturnValueOnce(['/tmp/initial.md'])
      .mockReturnValueOnce(['/tmp/focused.md']);
    context.menu.createApplicationMenu.mockImplementation(
      ({ recentFiles }) => ({ recentFiles }),
    );

    await context.becomeReady();
    context.handlers['browser-window-focus']();

    expect(context.menu.createApplicationMenu).toHaveBeenCalledTimes(2);
    expect(
      context.menu.createApplicationMenu.mock.calls[0][0].recentFiles,
    ).toEqual(['/tmp/initial.md']);
    expect(
      context.menu.createApplicationMenu.mock.calls[1][0].recentFiles,
    ).toEqual(['/tmp/focused.md']);
    expect(context.electron.Menu.setApplicationMenu).toHaveBeenNthCalledWith(
      1,
      { recentFiles: ['/tmp/initial.md'] },
    );
    expect(context.electron.Menu.setApplicationMenu).toHaveBeenNthCalledWith(
      2,
      { recentFiles: ['/tmp/focused.md'] },
    );
  });
});
