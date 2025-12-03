const { app, Menu } = require('electron');
const { createMainWindow, ensureMainWindow } = require('./app/mainWindow');
const { createApplicationMenu } = require('./app/menu');
const { openFile } = require('./app/fileDialog');
const { exportFile } = require('./app/exporter');
const { setAlwaysOnTop } = require('./app/windowActions');

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  ensureMainWindow();
});

app.whenReady().then(() => {
  createMainWindow();
  const menu = createApplicationMenu({
    openFile,
    exportPdf: () => exportFile('pdf'),
    exportPptx: () => exportFile('pptx'),
    toggleAlwaysOnTop: setAlwaysOnTop,
  });
  Menu.setApplicationMenu(menu);
});
