const fs = require('fs');
const path = require('path');
const { app, Menu, dialog } = require('electron');
const {
  createMainWindow,
  ensureMainWindow,
  getFocusedWindow,
} = require('./app/mainWindow');
const { createApplicationMenu } = require('./app/menu');
const { openFile, openFilePath, openFiles } = require('./app/fileDialog');
const { exportFile } = require('./app/exporter');
const { pasteClipboardImage } = require('./app/clipboardImage');
const { setAlwaysOnTop } = require('./app/windowActions');
const {
  clearRecentFiles,
  getRecentFiles,
  initializeRecentFiles,
  onRecentFilesChange,
  removeRecentFile,
} = require('./app/recentFiles');

const pendingFilePaths = [];
let handleOpenFile = (filePath) => {
  pendingFilePaths.push(filePath);
};

app.on('open-file', (event, filePath) => {
  event.preventDefault();
  handleOpenFile(filePath);
});

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

  const buildMenu = (recentFiles) =>
    createApplicationMenu({
      newWindow: createMainWindow,
      openFile: (window) => openFile(window || getFocusedWindow()),
      pasteImage: (window) => pasteClipboardImage(window || getFocusedWindow()),
      exportPdf: (window) => exportFile(window || getFocusedWindow(), 'pdf'),
      exportPptx: (window) => exportFile(window || getFocusedWindow(), 'pptx'),
      toggleAlwaysOnTop: setAlwaysOnTop,
      alwaysOnTop: Boolean(getFocusedWindow()?.isAlwaysOnTop?.()),
      recentFiles,
      openRecentFile: (filePath, window) => {
        if (!fs.existsSync(filePath)) {
          dialog.showErrorBox(
            'File not found',
            `The file "${filePath}" cannot be opened because it no longer exists.`,
          );
          removeRecentFile(filePath);
          return;
        }
        void openFilePath(filePath, window || getFocusedWindow()).catch(
          (error) => {
            dialog.showErrorBox('Open Error', error.message);
          },
        );
      },
      clearRecentFiles,
    });

  const refreshMenu = (recentFiles) => {
    const menu = buildMenu(recentFiles);
    Menu.setApplicationMenu(menu);
  };

  refreshMenu(getRecentFiles());
  onRecentFilesChange(refreshMenu);
  app.on('browser-window-focus', () => refreshMenu(getRecentFiles()));

  handleOpenFile = (filePath) => {
    void openFilePath(filePath, getFocusedWindow()).catch((error) => {
      dialog.showErrorBox('Open Error', error.message);
    });
  };

  if (pendingFilePaths.length > 0) {
    const startupFiles = pendingFilePaths.splice(0);
    void openFiles(null, startupFiles).catch((error) => {
      dialog.showErrorBox('Open Error', error.message);
    });
  } else {
    createMainWindow();
  }
});
