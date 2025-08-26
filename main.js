const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const { Marp } = require('@marp-team/marp-core');

let mainWindow;
let watcher;

const marp = new Marp({ inlineSVG: true });

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', function () {
    mainWindow = null;
    if (watcher) {
      watcher.close();
    }
  });
}

function renderAndSend(filePath) {
  try {
    const markdown = fs.readFileSync(filePath, 'utf-8');
    const { html, css } = marp.render(markdown);
    mainWindow.webContents.send('marp-rendered', { html, css });
    mainWindow.setTitle(path.basename(filePath));
  } catch (error) {
    dialog.showErrorBox('Render Error', `Failed to render file: ${error.message}`);
  }
}

function openFile() {
  dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
  }).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      renderAndSend(filePath);
      startWatching(filePath);
    }
  }).catch(err => {
    console.log(err);
    dialog.showErrorBox('Dialog Error', `An error occurred: ${err.message}`);
  });
}

function startWatching(filePath) {
  if (watcher) {
    watcher.close();
  }
  watcher = chokidar.watch(filePath, { persistent: true });
  watcher.on('change', (path) => {
    renderAndSend(path);
  });
}

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
        role: 'quit'
      }
    ],
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'toggledevtools' }
    ]
  }
];

app.on('ready', () => {
  createWindow();
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
