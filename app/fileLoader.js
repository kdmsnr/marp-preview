const { getCurrentFilePath, setCurrentFilePath } = require('./state');
const { renderAndSend } = require('./markdownRenderer');
const { startWatching } = require('./fileWatcher');
const { addRecentFile } = require('./recentFiles');

async function loadFile(filePath) {
  if (!filePath) {
    return false;
  }

  setCurrentFilePath(filePath);
  addRecentFile(filePath);

  const dependencies = await renderAndSend(filePath);
  if (getCurrentFilePath() === filePath) {
    startWatching(filePath, dependencies);
  }

  return true;
}

module.exports = {
  loadFile,
};
