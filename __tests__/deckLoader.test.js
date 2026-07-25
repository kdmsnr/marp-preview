const mockReadFile = jest.fn();

jest.mock('fs', () => ({
  promises: {
    readFile: mockReadFile,
  },
}));

const path = require('path');
const { loadDeck, resolveIncludePath } = require('../app/deckLoader');

describe('deckLoader', () => {
  const entryPath = path.resolve('/tmp/presentation/deck.md');
  const firstPath = path.resolve('/tmp/presentation/01-title.md');
  const secondPath = path.resolve('/tmp/presentation/02-body.markdown');

  beforeEach(() => {
    mockReadFile.mockReset();
  });

  function provideFiles(files) {
    mockReadFile.mockImplementation(async (filePath) => {
      const resolvedPath = path.resolve(filePath);
      if (!Object.hasOwn(files, resolvedPath)) {
        const error = new Error(`ENOENT: ${resolvedPath}`);
        error.code = 'ENOENT';
        throw error;
      }
      return files[resolvedPath];
    });
  }

  test('returns a single Markdown file unchanged', async () => {
    provideFiles({ [entryPath]: '# Deck' });

    await expect(loadDeck(entryPath)).resolves.toEqual({
      markdown: '# Deck',
      dependencies: [entryPath],
    });
  });

  test('expands same-directory include directives in place', async () => {
    provideFiles({
      [entryPath]: [
        '# Deck',
        '',
        '<!-- @include: 01-title.md -->',
        '',
        '---',
        '',
        '<!-- @include: 02-body.markdown -->',
      ].join('\n'),
      [firstPath]: '# Title',
      [secondPath]: '# Body',
    });

    await expect(loadDeck(entryPath)).resolves.toEqual({
      markdown: ['# Deck', '', '# Title', '', '---', '', '# Body'].join('\n'),
      dependencies: [entryPath, firstPath, secondPath],
    });
  });

  test('supports quoted file names and nested includes', async () => {
    const nestedPath = path.resolve('/tmp/presentation/03 details.md');
    provideFiles({
      [entryPath]: '<!-- @include: 01-title.md -->',
      [firstPath]: '<!-- @include: "03 details.md" -->',
      [nestedPath]: '# Details',
    });

    await expect(loadDeck(entryPath)).resolves.toEqual({
      markdown: '# Details',
      dependencies: [entryPath, firstPath, nestedPath],
    });
  });

  test('leaves the old colonless include syntax unchanged', async () => {
    provideFiles({
      [entryPath]: '<!-- @include 01-title.md -->',
      [firstPath]: '# Title',
    });

    await expect(loadDeck(entryPath)).resolves.toEqual({
      markdown: '<!-- @include 01-title.md -->',
      dependencies: [entryPath],
    });
    expect(mockReadFile).not.toHaveBeenCalledWith(firstPath, 'utf-8');
  });

  test.each(['slides/01.md', '../01.md', '/tmp/01.md'])(
    'rejects an include outside the entry directory: %s',
    async (includePath) => {
      provideFiles({
        [entryPath]: `<!-- @include: ${includePath} -->`,
      });

      await expect(loadDeck(entryPath)).rejects.toThrow(
        'must be in the same directory',
      );
    },
  );

  test('reports missing includes as dependencies so they can be watched', async () => {
    provideFiles({
      [entryPath]: '<!-- @include: missing.md -->',
    });

    await expect(loadDeck(entryPath)).rejects.toMatchObject({
      code: 'ENOENT',
      dependencies: [entryPath, path.resolve('/tmp/presentation/missing.md')],
    });
  });

  test('rejects circular includes', async () => {
    provideFiles({
      [entryPath]: '<!-- @include: 01-title.md -->',
      [firstPath]: '<!-- @include: deck.md -->',
    });

    await expect(loadDeck(entryPath)).rejects.toThrow(
      'Circular include detected: deck.md -> 01-title.md -> deck.md',
    );
  });

  test('accepts only Markdown file extensions', () => {
    expect(() => resolveIncludePath('/tmp/presentation', 'notes.txt')).toThrow(
      'must use the .md or .markdown extension',
    );
  });
});
