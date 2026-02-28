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
    click() {
      openRecentFile(filePath);
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
  openFile,
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
          label: 'Open File',
          accelerator: 'CmdOrCtrl+O',
          click() {
            openFile();
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
              click() {
                exportPdf();
              },
            },
            {
              label: 'Export as PPTX',
              click() {
                exportPptx();
              },
            },
          ],
        },
        {
          role: 'quit',
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
          click(menuItem) {
            toggleAlwaysOnTop(menuItem.checked);
          },
        },
        { role: 'reload' },
        { role: 'toggledevtools' },
      ],
    },
  ];

  return Menu.buildFromTemplate(menuTemplate);
}

module.exports = {
  createApplicationMenu,
};
