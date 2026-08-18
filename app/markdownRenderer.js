const path = require('path');
const { dialog } = require('electron');
const { CITATION_BASE_PATH } = require('./citations');
const { loadDeck } = require('./deckLoader');
const { LOCAL_IMAGE_BASE_PATH } = require('./localImagePaths');
const { createMarp } = require('./marp');
const { isCurrentRender } = require('./state');

const marp = createMarp();

async function renderAndSend(window, filePath, revision) {
  let dependencies = [filePath];

  try {
    const deck = await loadDeck(filePath);
    const { markdown } = deck;
    dependencies = deck.dependencies;
    const { html, css } = marp.render(markdown, {
      [CITATION_BASE_PATH]: path.dirname(filePath),
      [LOCAL_IMAGE_BASE_PATH]: path.dirname(filePath),
    });
    if (
      isCurrentRender(window, filePath, revision) &&
      !window.isDestroyed?.()
    ) {
      window.webContents.send('marp-rendered', { html, css });
      window.setTitle(path.basename(filePath));
      window.setRepresentedFilename?.(filePath);
    }
  } catch (error) {
    dependencies = error.dependencies || dependencies;
    if (isCurrentRender(window, filePath, revision)) {
      dialog.showErrorBox(
        'Render Error',
        `Failed to render file: ${error.message}`,
      );
    }
  }

  return dependencies;
}

module.exports = {
  renderAndSend,
};
