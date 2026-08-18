const mockShowErrorBox = jest.fn();
const mockRender = jest.fn();
const mockLoadDeck = jest.fn();
const mockCreateMarp = jest.fn(() => ({
  render: mockRender,
}));

jest.mock('electron', () => ({
  dialog: {
    showErrorBox: mockShowErrorBox,
  },
}));

jest.mock('../app/deckLoader', () => ({
  loadDeck: mockLoadDeck,
}));

jest.mock('../app/marp', () => ({
  createMarp: mockCreateMarp,
}));

jest.mock('../app/state', () => ({
  isCurrentRender: jest.fn(),
}));

const state = require('../app/state');
const { dialog } = require('electron');
const { renderAndSend } = require('../app/markdownRenderer');

function createWindow(id) {
  return {
    id,
    webContents: { send: jest.fn() },
    setTitle: jest.fn(),
    setRepresentedFilename: jest.fn(),
    isDestroyed: jest.fn(() => false),
  };
}

describe('markdownRenderer', () => {
  let firstWindow;
  let secondWindow;

  beforeEach(() => {
    firstWindow = createWindow(1);
    secondWindow = createWindow(2);
    mockLoadDeck.mockReset();
    mockShowErrorBox.mockReset();
    mockRender.mockReset();
    state.isCurrentRender.mockReset();
    state.isCurrentRender.mockReturnValue(true);
  });

  test('renders each deck only into its explicitly supplied window', async () => {
    mockLoadDeck.mockImplementation(async (filePath) => ({
      markdown: filePath === '/tmp/first.md' ? '# First' : '# Second',
      dependencies: [filePath],
    }));
    mockRender.mockImplementation((markdown) => ({
      html: `<h1>${markdown.slice(2)}</h1>`,
      css: `/* ${markdown} */`,
    }));

    const [firstDependencies, secondDependencies] = await Promise.all([
      renderAndSend(firstWindow, '/tmp/first.md', 11),
      renderAndSend(secondWindow, '/tmp/second.md', 27),
    ]);

    expect(firstWindow.webContents.send).toHaveBeenCalledWith('marp-rendered', {
      html: '<h1>First</h1>',
      css: '/* # First */',
    });
    expect(secondWindow.webContents.send).toHaveBeenCalledWith(
      'marp-rendered',
      { html: '<h1>Second</h1>', css: '/* # Second */' },
    );
    expect(firstWindow.webContents.send).toHaveBeenCalledTimes(1);
    expect(secondWindow.webContents.send).toHaveBeenCalledTimes(1);
    expect(firstWindow.setTitle).toHaveBeenCalledWith('first.md');
    expect(secondWindow.setTitle).toHaveBeenCalledWith('second.md');
    expect(firstWindow.setRepresentedFilename).toHaveBeenCalledWith(
      '/tmp/first.md',
    );
    expect(secondWindow.setRepresentedFilename).toHaveBeenCalledWith(
      '/tmp/second.md',
    );
    expect(state.isCurrentRender).toHaveBeenCalledWith(
      firstWindow,
      '/tmp/first.md',
      11,
    );
    expect(state.isCurrentRender).toHaveBeenCalledWith(
      secondWindow,
      '/tmp/second.md',
      27,
    );
    expect(firstDependencies).toEqual(['/tmp/first.md']);
    expect(secondDependencies).toEqual(['/tmp/second.md']);
    expect(dialog.showErrorBox).not.toHaveBeenCalled();
  });

  test('lets a newer render revision win when an older render finishes last', async () => {
    let finishOlderRender;
    let finishNewerRender;
    mockLoadDeck
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishOlderRender = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishNewerRender = resolve;
          }),
      );
    mockRender.mockImplementation((markdown) => ({
      html: `<p>${markdown}</p>`,
      css: '',
    }));
    state.isCurrentRender.mockImplementation(
      (window, filePath, revision) =>
        window === firstWindow && filePath === '/tmp/deck.md' && revision === 2,
    );

    const older = renderAndSend(firstWindow, '/tmp/deck.md', 1);
    const newer = renderAndSend(firstWindow, '/tmp/deck.md', 2);

    finishNewerRender({
      markdown: 'newer',
      dependencies: ['/tmp/deck.md', '/tmp/newer.md'],
    });
    await newer;
    finishOlderRender({
      markdown: 'older',
      dependencies: ['/tmp/deck.md', '/tmp/older.md'],
    });
    await older;

    expect(firstWindow.webContents.send).toHaveBeenCalledTimes(1);
    expect(firstWindow.webContents.send).toHaveBeenCalledWith('marp-rendered', {
      html: '<p>newer</p>',
      css: '',
    });
    expect(firstWindow.setTitle).toHaveBeenCalledTimes(1);
  });

  test('shows an error only when the failed render revision is current', async () => {
    const currentError = new Error('current boom');
    currentError.dependencies = ['/tmp/current.md', '/tmp/missing.md'];
    const staleError = new Error('stale boom');
    mockLoadDeck
      .mockRejectedValueOnce(currentError)
      .mockRejectedValueOnce(staleError);
    state.isCurrentRender.mockImplementation(
      (_window, _filePath, revision) => revision === 4,
    );

    const currentDependencies = await renderAndSend(
      firstWindow,
      '/tmp/current.md',
      4,
    );
    const staleDependencies = await renderAndSend(
      firstWindow,
      '/tmp/stale.md',
      3,
    );

    expect(dialog.showErrorBox).toHaveBeenCalledTimes(1);
    expect(dialog.showErrorBox).toHaveBeenCalledWith(
      'Render Error',
      expect.stringContaining('current boom'),
    );
    expect(currentDependencies).toEqual(['/tmp/current.md', '/tmp/missing.md']);
    expect(staleDependencies).toEqual(['/tmp/stale.md']);
  });

  test('skips sending a current render when its window has been destroyed', async () => {
    mockLoadDeck.mockResolvedValue({
      markdown: '# Deck',
      dependencies: ['/tmp/slides.md'],
    });
    mockRender.mockReturnValue({ html: '<h1>Deck</h1>', css: 'body{}' });
    firstWindow.isDestroyed.mockReturnValue(true);

    await renderAndSend(firstWindow, '/tmp/slides.md', 8);

    expect(state.isCurrentRender).toHaveBeenCalledWith(
      firstWindow,
      '/tmp/slides.md',
      8,
    );
    expect(firstWindow.webContents.send).not.toHaveBeenCalled();
    expect(firstWindow.setTitle).not.toHaveBeenCalled();
  });

  test('passes file-relative plugin paths to the shared Marp renderer', async () => {
    mockLoadDeck.mockResolvedValue({
      markdown: '# Sample',
      dependencies: ['/tmp/slides.md', '/tmp/part.md'],
    });
    mockRender.mockReturnValue({ html: '<h1>Sample</h1>', css: 'body{}' });

    await renderAndSend(firstWindow, '/tmp/slides.md', 5);

    expect(mockRender).toHaveBeenCalledWith('# Sample', {
      citationBasePath: '/tmp',
      localImageBasePath: '/tmp',
    });
    expect(mockCreateMarp).toHaveBeenCalledTimes(1);
  });
});
