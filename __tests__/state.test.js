describe('state module', () => {
  let state;

  beforeEach(() => {
    jest.resetModules();
    state = require('../app/state');
  });

  test('tracks the main window reference', () => {
    const window = { id: 'main' };
    state.setMainWindow(window);
    expect(state.getMainWindow()).toBe(window);
    state.clearMainWindow();
    expect(state.getMainWindow()).toBeNull();
  });

  test('tracks the file watcher', () => {
    const watcher = { id: 'watcher' };
    state.setWatcher(watcher);
    expect(state.getWatcher()).toBe(watcher);
    state.clearWatcher();
    expect(state.getWatcher()).toBeNull();
  });

  test('tracks the current file path', () => {
    state.setCurrentFilePath('/tmp/test.md');
    expect(state.getCurrentFilePath()).toBe('/tmp/test.md');
  });
});
