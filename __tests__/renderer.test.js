describe('renderer', () => {
  let container;
  let renderCallback;

  beforeEach(() => {
    jest.resetModules();
    container = { innerHTML: '' };
    renderCallback = null;

    global.document = {
      getElementById: jest.fn(() => container),
    };
    global.window = {
      electronAPI: {
        onMarpRendered: jest.fn((callback) => {
          renderCallback = callback;
        }),
      },
    };

    require('../renderer');
  });

  afterEach(() => {
    delete global.document;
    delete global.window;
  });

  test('accepts empty html and css payloads to clear preview', () => {
    renderCallback({ html: '', css: '' });
    expect(container.innerHTML).toBe('<style></style>');
  });

  test('shows an error when payload is invalid', () => {
    renderCallback({ html: '<p>only html</p>' });
    expect(container.innerHTML).toContain('Invalid data received.');
  });
});
