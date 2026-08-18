describe('state module', () => {
  let state;

  beforeEach(() => {
    jest.resetModules();
    state = require('../app/state');
  });

  test('tracks file state independently for each window', () => {
    const firstWindow = { id: 1 };
    const secondWindow = { id: 2 };
    state.registerWindow(firstWindow);
    state.registerWindow(secondWindow);

    const firstReservation = state.reserveFile(firstWindow, '/tmp/first.md');
    const secondReservation = state.reserveFile(secondWindow, '/tmp/second.md');

    expect(state.getCurrentFilePath(firstWindow)).toBe('/tmp/first.md');
    expect(state.getCurrentFilePath(secondWindow)).toBe('/tmp/second.md');
    expect(state.findWindowSessionByFilePath('/tmp/first.md')).toBe(
      firstReservation.session,
    );
    expect(state.findWindowSessionByFilePath('/tmp/second.md')).toBe(
      secondReservation.session,
    );

    state.clearCurrentFilePath(firstWindow);

    expect(state.getCurrentFilePath(firstWindow)).toBeNull();
    expect(state.getCurrentFilePath(secondWindow)).toBe('/tmp/second.md');
  });

  test('stores readiness per window', async () => {
    const firstWindow = { id: 1 };
    const secondWindow = { id: 2 };
    const firstReady = Promise.resolve('first');
    const secondReady = Promise.resolve('second');
    state.registerWindow(firstWindow);
    state.registerWindow(secondWindow);

    state.setWindowReady(firstWindow, firstReady);
    state.setWindowReady(secondWindow, secondReady);

    expect(state.getWindowSession(firstWindow).ready).toBe(firstReady);
    expect(state.getWindowSession(secondWindow).ready).toBe(secondReady);
    await expect(state.getWindowSession(firstWindow).ready).resolves.toBe(
      'first',
    );
    await expect(state.getWindowSession(secondWindow).ready).resolves.toBe(
      'second',
    );
  });

  test('unregisters only the closed window and invalidates its render', () => {
    const firstWindow = { id: 1 };
    const secondWindow = { id: 2 };
    const firstSession = state.registerWindow(firstWindow);
    state.registerWindow(secondWindow);
    const reservation = state.reserveFile(firstWindow, '/tmp/first.md');

    state.unregisterWindow(firstWindow);

    expect(firstSession.disposed).toBe(true);
    expect(state.getWindowSession(firstWindow)).toBeNull();
    expect(state.getWindowSessions()).toEqual([
      state.getWindowSession(secondWindow),
    ]);
    expect(
      state.isCurrentRender(
        firstWindow,
        reservation.filePath,
        reservation.revision,
      ),
    ).toBe(false);
  });

  test('invalidates older render revisions within the same window', () => {
    const window = { id: 1 };
    state.registerWindow(window);
    const initialRender = state.reserveFile(window, '/tmp/deck.md');

    expect(
      state.isCurrentRender(
        window,
        initialRender.filePath,
        initialRender.revision,
      ),
    ).toBe(true);

    const nextRevision = state.beginRender(window, '/tmp/deck.md');

    expect(
      state.isCurrentRender(
        window,
        initialRender.filePath,
        initialRender.revision,
      ),
    ).toBe(false);
    expect(
      state.isCurrentRender(window, initialRender.filePath, nextRevision),
    ).toBe(true);
    expect(state.beginRender(window, '/tmp/other.md')).toBeNull();
  });

  test('returns the existing session when a window id is registered twice', () => {
    const originalWindow = { id: 1 };
    const replacementWindow = { id: 1 };

    const originalSession = state.registerWindow(originalWindow);
    const replacementSession = state.registerWindow(replacementWindow);

    expect(replacementSession).toBe(originalSession);
    expect(state.getWindowSessions()).toHaveLength(1);
    expect(state.getWindowSession(replacementWindow)).toBe(originalSession);
    expect(originalSession.window).toBe(originalWindow);
  });

  test('rejects windows without an id', () => {
    expect(() => state.registerWindow({})).toThrow(TypeError);
  });
});
