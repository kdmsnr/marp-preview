const fs = require('fs');
const path = require('path');
const { app, Menu, dialog } = require('electron');
const { createMainWindow, ensureMainWindow } = require('./app/mainWindow');
const { createApplicationMenu } = require('./app/menu');
const { openFile } = require('./app/fileDialog');
const { loadFile } = require('./app/fileLoader');
const { exportFile } = require('./app/exporter');
const { setAlwaysOnTop } = require('./app/windowActions');
const {
  clearRecentFiles,
  getRecentFiles,
  initializeRecentFiles,
  onRecentFilesChange,
  removeRecentFile,
} = require('./app/recentFiles');

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  ensureMainWindow();
});

app.whenReady().then(() => {
  const storagePath = path.join(app.getPath('userData'), 'recent-files.json');
  initializeRecentFiles(storagePath);

  const buildMenu = (recentFiles) => createApplicationMenu({
    openFile,
    exportPdf: () => exportFile('pdf'),
    exportPptx: () => exportFile('pptx'),
    toggleAlwaysOnTop: setAlwaysOnTop,
    recentFiles,
    openRecentFile: (filePath) => {
      if (!fs.existsSync(filePath)) {
        dialog.showErrorBox('File not found', `The file "${filePath}" cannot be opened because it no longer exists.`);
        removeRecentFile(filePath);
        return;
      }
      loadFile(filePath);
    },
    clearRecentFiles,
  });

  const refreshMenu = (recentFiles) => {
    const menu = buildMenu(recentFiles);
    Menu.setApplicationMenu(menu);
  };

  createMainWindow();
  refreshMenu(getRecentFiles());
  onRecentFilesChange(refreshMenu);
});
