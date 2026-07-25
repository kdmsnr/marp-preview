const path = require('path');
const { dialog } = require('electron');
const { CITATION_BASE_PATH } = require('./citations');
const { loadDeck } = require('./deckLoader');
const { LOCAL_IMAGE_BASE_PATH } = require('./localImagePaths');
const { createMarp } = require('./marp');
const { getMainWindow } = require('./state');

const marp = createMarp();

async function renderAndSend(filePath) {
  let dependencies = [filePath];

  try {
    const deck = await loadDeck(filePath);
    const { markdown } = deck;
    dependencies = deck.dependencies;
    const { html, css } = marp.render(markdown, {
      [CITATION_BASE_PATH]: path.dirname(filePath),
      [LOCAL_IMAGE_BASE_PATH]: path.dirname(filePath),
    });
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('marp-rendered', { html, css });
      mainWindow.setTitle(path.basename(filePath));
    } else {
      console.warn(
        'Attempted to render to a non-existent or destroyed window.',
      );
    }
  } catch (error) {
    dependencies = error.dependencies || dependencies;
    dialog.showErrorBox(
      'Render Error',
      `Failed to render file: ${error.message}`,
    );
  }

  return dependencies;
}

module.exports = {
  renderAndSend,
};
