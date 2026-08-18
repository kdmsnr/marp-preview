const { getWindowSession, isCurrentRender, reserveFile } = require('./state');
const { renderAndSend } = require('./markdownRenderer');
const { startWatching, stopWatching } = require('./fileWatcher');
const { addRecentFile } = require('./recentFiles');

async function loadFile(window, filePath) {
  if (!window || !filePath || !getWindowSession(window)) {
    return false;
  }

  stopWatching(window);
  const render = reserveFile(window, filePath);
  if (!render) return false;

  await render.session.ready;
  if (!isCurrentRender(window, render.filePath, render.revision)) {
    return false;
  }

  addRecentFile(render.filePath);
  const dependencies = await renderAndSend(
    window,
    render.filePath,
    render.revision,
  );
  if (isCurrentRender(window, render.filePath, render.revision)) {
    startWatching(window, render.filePath, dependencies);
  }

  return true;
}

module.exports = {
  loadFile,
};
