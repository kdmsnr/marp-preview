const { getMainWindow } = require('./state');

function setAlwaysOnTop(shouldBeOnTop) {
  const mainWindow = getMainWindow();
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(shouldBeOnTop);
  }
}

module.exports = {
  setAlwaysOnTop,
};
