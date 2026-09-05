const mockBuildFromTemplate = jest.fn((template) => ({ template }));

jest.mock('electron', () => ({
  Menu: {
    buildFromTemplate: mockBuildFromTemplate,
  },
}));

const { createApplicationMenu } = require('../app/menu');

describe('menu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('builds a menu with empty recent files', () => {
    const browserWindow = { id: 'target-window' };
    const handlers = {
      newWindow: jest.fn(),
      openFile: jest.fn(),
      pasteImage: jest.fn(),
      exportPdf: jest.fn(),
      exportPptx: jest.fn(),
      toggleAlwaysOnTop: jest.fn(),
      clearRecentFiles: jest.fn(),
    };

    createApplicationMenu({
      ...handlers,
      alwaysOnTop: true,
      recentFiles: [],
    });

    const template = mockBuildFromTemplate.mock.calls[0][0];
    const recentSubmenu = template[0].submenu[2].submenu;
    expect(recentSubmenu[0]).toMatchObject({
      label: 'No recent files',
      enabled: false,
    });
    const alwaysOnTop = template[2].submenu[0];
    expect(alwaysOnTop.checked).toBe(true);
    alwaysOnTop.click({ checked: true }, browserWindow);
    expect(handlers.toggleAlwaysOnTop).toHaveBeenCalledWith(
      browserWindow,
      true,
    );
  });

  test('forwards the target window to file actions', () => {
    const browserWindow = { id: 'target-window' };
    const newWindow = jest.fn();
    const openRecentFile = jest.fn();
    const clearRecentFiles = jest.fn();
    const exportPdf = jest.fn();
    const exportPptx = jest.fn();
    const openFile = jest.fn();
    const pasteImage = jest.fn();

    createApplicationMenu({
      newWindow,
      openFile,
      pasteImage,
      exportPdf,
      exportPptx,
      toggleAlwaysOnTop: jest.fn(),
      recentFiles: ['/tmp/one.md'],
      openRecentFile,
      clearRecentFiles,
    });

    const template = mockBuildFromTemplate.mock.calls[0][0];
    template[0].submenu[0].click();
    expect(newWindow).toHaveBeenCalledWith();

    template[0].submenu[1].click({}, browserWindow);
    expect(openFile).toHaveBeenCalledWith(browserWindow);

    const recentEntry = template[0].submenu[2].submenu[0];
    recentEntry.click({}, browserWindow);
    expect(openRecentFile).toHaveBeenCalledWith('/tmp/one.md', browserWindow);

    const clearItem = template[0].submenu[2].submenu[2];
    clearItem.click();
    expect(clearRecentFiles).toHaveBeenCalledWith();

    const exportMenu = template[0].submenu[3].submenu;
    exportMenu[0].click({}, browserWindow);
    exportMenu[1].click({}, browserWindow);
    expect(exportPdf).toHaveBeenCalledWith(browserWindow);
    expect(exportPptx).toHaveBeenCalledWith(browserWindow);

    const pasteImageItem = template[1].submenu[0];
    expect(pasteImageItem.accelerator).toBe('CmdOrCtrl+V');
    pasteImageItem.click({}, browserWindow);
    expect(pasteImage).toHaveBeenCalledWith(browserWindow);

    expect(template[0].submenu[5]).toEqual({ role: 'close' });
    expect(template[3]).toEqual({ role: 'windowMenu' });
  });
});
