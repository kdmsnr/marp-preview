const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const { Marp } = require('@marp-team/marp-core');
const { spawn } = require('child_process');

let mainWindow;
let watcher;
let currentFilePath = null;

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
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('marp-rendered', { html, css });
      mainWindow.setTitle(path.basename(filePath));
    } else {
      console.warn('Attempted to render to a non-existent or destroyed window.');
    }
  }
  catch (error) {
    dialog.showErrorBox('Render Error', `Failed to render file: ${error.message}`);
  }
}

function openFile() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow();
  }

  dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
  }).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      currentFilePath = filePath;
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

function marpJsPath() {
  const pkgPath = require.resolve('@marp-team/marp-cli/package.json');
  const pkg = require(pkgPath);
  return path.join(path.dirname(pkgPath), pkg.bin.marp);
}

function runMarpCLI(input, output) {
  return new Promise((resolve, reject) => {
    const cli = marpJsPath();

    const child = spawn(process.execPath, [cli, input, '-o', output], {
      cwd: path.dirname(input),
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
      stdio: ['ignore', 'ignore', 'ignore'],
      windowsHide: true,
    });

    const t = setTimeout(() => {
      child.kill();
      reject(new Error('Marp CLI timed out'));
    }, 60000);

    child.on('error', (err) => {
      clearTimeout(t);
      reject(err);
    });

    child.on('close', (code) => {
      clearTimeout(t);
      if (code === 0) resolve();
      else reject(new Error(`Marp CLI exited with code ${code}`));
    });
  });
}

async function exportFile(format) {
  if (!currentFilePath) {
    dialog.showErrorBox('Export Error', 'No file is currently open to export.');
    return;
  }

  const defaultFileName = `${path.basename(currentFilePath, path.extname(currentFilePath))}.${format}`;
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultFileName,
    filters: [{ name: format.toUpperCase(), extensions: [format] }],
  });
  if (canceled || !filePath) return;

  try {
    await runMarpCLI(currentFilePath, filePath);
    fs.accessSync(filePath, fs.constants.R_OK);
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Export Successful',
      message: `File exported to:\n${filePath}`,
    });
  }
  catch (e) {
    dialog.showErrorBox('Export Failed', e.message);
  }
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
        label: 'Export',
        submenu: [
          {
            label: 'Export as PDF',
            click() {
              exportFile('pdf');
            },
          },
          {
            label: 'Export as PPTX',
            click() {
              exportFile('pptx');
            },
          },
        ],
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
