const { setCurrentFilePath } = require('./state');
const { renderAndSend } = require('./markdownRenderer');
const { startWatching } = require('./fileWatcher');
const { addRecentFile } = require('./recentFiles');

function loadFile(filePath) {
  if (!filePath) {
    return false;
  }

  setCurrentFilePath(filePath);
  renderAndSend(filePath);
  startWatching(filePath);
  addRecentFile(filePath);
  return true;
}

module.exports = {
  loadFile,
};
