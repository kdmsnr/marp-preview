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
    const handlers = {
      openFile: jest.fn(),
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
    const recentSubmenu =
      template[0].submenu[1].submenu;
    expect(recentSubmenu[0]).toMatchObject({
      label: 'No recent files',
      enabled: false,
    });
    const alwaysOnTop = template[1].submenu[0];
    expect(alwaysOnTop.checked).toBe(true);
    alwaysOnTop.click({ checked: true });
    expect(handlers.toggleAlwaysOnTop).toHaveBeenCalledWith(true);
  });

  test('builds a menu with recent file entries and export actions', () => {
    const openRecentFile = jest.fn();
    const clearRecentFiles = jest.fn();
    const exportPdf = jest.fn();
    const exportPptx = jest.fn();
    const openFile = jest.fn();

    createApplicationMenu({
      openFile,
      exportPdf,
      exportPptx,
      toggleAlwaysOnTop: jest.fn(),
      recentFiles: ['/tmp/one.md'],
      openRecentFile,
      clearRecentFiles,
    });

    const template = mockBuildFromTemplate.mock.calls[0][0];
    template[0].submenu[0].click();
    expect(openFile).toHaveBeenCalled();

    const recentEntry = template[0].submenu[1].submenu[0];
    recentEntry.click();
    expect(openRecentFile).toHaveBeenCalledWith('/tmp/one.md');

    const clearItem = template[0].submenu[1].submenu[2];
    clearItem.click();
    expect(clearRecentFiles).toHaveBeenCalled();

    const exportMenu = template[0].submenu[2].submenu;
    exportMenu[0].click();
    exportMenu[1].click();
    expect(exportPdf).toHaveBeenCalled();
    expect(exportPptx).toHaveBeenCalled();
  });
});
