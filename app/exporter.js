const fs = require('fs');
const path = require('path');
const { dialog } = require('electron');
const marpCli = require('@marp-team/marp-cli');
const { getCurrentFilePath, getMainWindow } = require('./state');

async function runMarpCLI(input, output) {
  const exitCode = await marpCli.marpCli([input, '-o', output]);
  if (exitCode !== 0) {
    throw new Error(`Marp CLI exited with code ${exitCode}`);
  }
}

async function exportFile(format) {
  const currentFilePath = getCurrentFilePath();
  if (!currentFilePath) {
    dialog.showErrorBox('Export Error', 'No file is currently open to export.');
    return;
  }

  const mainWindow = getMainWindow();
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

module.exports = {
  exportFile,
};
