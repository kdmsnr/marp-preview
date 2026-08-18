const mockMainWindow = {
  isDestroyed: jest.fn(() => false),
  setAlwaysOnTop: jest.fn(),
};

const { setAlwaysOnTop } = require('../app/windowActions');

describe('windowActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sets the always-on-top flag on the target window', () => {
    setAlwaysOnTop(mockMainWindow, true);
    expect(mockMainWindow.isDestroyed).toHaveBeenCalledWith();
    expect(mockMainWindow.setAlwaysOnTop).toHaveBeenCalledWith(true);
  });

  test('does nothing when there is no window', () => {
    setAlwaysOnTop(null, false);
    expect(mockMainWindow.setAlwaysOnTop).not.toHaveBeenCalled();
  });

  test('does nothing when the target window has been destroyed', () => {
    mockMainWindow.isDestroyed.mockReturnValue(true);

    setAlwaysOnTop(mockMainWindow, false);

    expect(mockMainWindow.setAlwaysOnTop).not.toHaveBeenCalled();
  });
});
