const { Menu } = require('electron');

function createApplicationMenu({ openFile, exportPdf, exportPptx, toggleAlwaysOnTop }) {
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
          checked: false,
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
