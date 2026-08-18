function setAlwaysOnTop(window, shouldBeOnTop) {
  if (window && !window.isDestroyed?.()) {
    window.setAlwaysOnTop(shouldBeOnTop);
  }
}

module.exports = {
  setAlwaysOnTop,
};
