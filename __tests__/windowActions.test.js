const mockMainWindow = {
  setAlwaysOnTop: jest.fn(),
};

jest.mock('../app/state', () => ({
  getMainWindow: jest.fn(() => mockMainWindow),
}));

const state = require('../app/state');
const { setAlwaysOnTop } = require('../app/windowActions');

describe('windowActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sets the always-on-top flag when a window exists', () => {
    setAlwaysOnTop(true);
    expect(mockMainWindow.setAlwaysOnTop).toHaveBeenCalledWith(true);
  });

  test('does nothing when there is no window', () => {
    state.getMainWindow.mockReturnValue(null);
    setAlwaysOnTop(false);
    expect(mockMainWindow.setAlwaysOnTop).not.toHaveBeenCalled();
  });
});
