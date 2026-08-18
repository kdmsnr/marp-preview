const { Menu } = require('electron');
const path = require('path');

function buildRecentFilesSubmenu(
  recentFiles,
  openRecentFile,
  clearRecentFiles,
) {
  if (!recentFiles || recentFiles.length === 0) {
    return [
      {
        label: 'No recent files',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: 'Clear Recent Files',
        enabled: false,
      },
    ];
  }

  const items = recentFiles.map((filePath, index) => ({
    label: `${index + 1}. ${path.basename(filePath)}`,
    sublabel: filePath,
    click(_menuItem, browserWindow) {
      openRecentFile(filePath, browserWindow);
    },
  }));

  return [
    ...items,
    { type: 'separator' },
    {
      label: 'Clear Recent Files',
      click() {
        clearRecentFiles();
      },
    },
  ];
}

function createApplicationMenu({
  newWindow = () => {},
  openFile,
  pasteImage = () => {},
  exportPdf,
  exportPptx,
  toggleAlwaysOnTop,
  alwaysOnTop = false,
  recentFiles = [],
  openRecentFile = () => {},
  clearRecentFiles = () => {},
}) {
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+N',
          click() {
            newWindow();
          },
        },
        {
          label: 'Open File',
          accelerator: 'CmdOrCtrl+O',
          click(_menuItem, browserWindow) {
            openFile(browserWindow);
          },
        },
        {
          label: 'Recent Files',
          submenu: buildRecentFilesSubmenu(
            recentFiles,
            openRecentFile,
            clearRecentFiles,
          ),
        },
        {
          label: 'Export',
          submenu: [
            {
              label: 'Export as PDF',
              click(_menuItem, browserWindow) {
                exportPdf(browserWindow);
              },
            },
            {
              label: 'Export as PPTX',
              click(_menuItem, browserWindow) {
                exportPptx(browserWindow);
              },
            },
          ],
        },
        { type: 'separator' },
        {
          role: 'close',
        },
        {
          role: 'quit',
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Paste Image and Copy Markdown',
          accelerator: 'CmdOrCtrl+V',
          click(_menuItem, browserWindow) {
            pasteImage(browserWindow);
          },
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Always On Top',
          type: 'checkbox',
          checked: alwaysOnTop,
          accelerator: 'CmdOrCtrl+T',
          click(menuItem, browserWindow) {
            toggleAlwaysOnTop(browserWindow, menuItem.checked);
          },
        },
        { role: 'reload' },
        { role: 'toggledevtools' },
      ],
    },
    {
      role: 'windowMenu',
    },
  ];

  return Menu.buildFromTemplate(menuTemplate);
}

module.exports = {
  createApplicationMenu,
};
