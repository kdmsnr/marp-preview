const { dialog } = require('electron');
const { ensureMainWindow } = require('./mainWindow');
const { loadFile } = require('./fileLoader');

async function openFile() {
  const mainWindow = ensureMainWindow();

  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      loadFile(result.filePaths[0]);
    }
  } catch (err) {
    console.error(err);
    dialog.showErrorBox('Dialog Error', `An error occurred: ${err.message}`);
  }
}

module.exports = {
  openFile,
};
