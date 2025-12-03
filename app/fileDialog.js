const { dialog } = require('electron');
const { ensureMainWindow } = require('./mainWindow');
const { setCurrentFilePath } = require('./state');
const { renderAndSend } = require('./markdownRenderer');
const { startWatching } = require('./fileWatcher');

function openFile() {
  const mainWindow = ensureMainWindow();

  dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
  }).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      setCurrentFilePath(filePath);
      renderAndSend(filePath);
      startWatching(filePath);
    }
  }).catch(err => {
    console.log(err);
    dialog.showErrorBox('Dialog Error', `An error occurred: ${err.message}`);
  });
}

module.exports = {
  openFile,
};
