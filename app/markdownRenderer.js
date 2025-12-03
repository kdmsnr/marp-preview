const fs = require('fs');
const path = require('path');
const { dialog } = require('electron');
const { Marp } = require('@marp-team/marp-core');
const { getMainWindow } = require('./state');

const marp = new Marp({ inlineSVG: true });

function renderAndSend(filePath) {
  try {
    const markdown = fs.readFileSync(filePath, 'utf-8');
    const { html, css } = marp.render(markdown);
    const mainWindow = getMainWindow();
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

module.exports = {
  renderAndSend,
};
