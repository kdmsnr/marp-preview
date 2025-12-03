const fs = require('fs');
const os = require('os');
const path = require('path');

describe('recentFiles', () => {
  let recentFiles;

  const createTempStoragePath = () => path.join(
    os.tmpdir(),
    `marp-preview-tests-${Date.now()}-${Math.random().toString(16).slice(2)}.json`,
  );

  const removeFile = (filePath) => {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  };

  beforeEach(() => {
    jest.resetModules();
    recentFiles = require('../app/recentFiles');
    recentFiles.initializeRecentFiles(null);
    recentFiles.clearRecentFiles();
  });

  afterEach(() => {
    recentFiles.initializeRecentFiles(null);
  });

  test('adds files in most-recent-first order without duplicates', () => {
    recentFiles.addRecentFile('/tmp/one.md');
    recentFiles.addRecentFile('/tmp/two.md');
    recentFiles.addRecentFile('/tmp/one.md');

    expect(recentFiles.getRecentFiles()).toEqual([
      '/tmp/one.md',
      '/tmp/two.md',
    ]);
  });

  test('only keeps the latest 10 files', () => {
    for (let i = 0; i < 12; i += 1) {
      recentFiles.addRecentFile(`/tmp/file-${i}.md`);
    }

    const stored = recentFiles.getRecentFiles();
    expect(stored).toHaveLength(10);
    expect(stored[0]).toBe('/tmp/file-11.md');
    expect(stored[stored.length - 1]).toBe('/tmp/file-2.md');
  });

  test('removes files and ignores missing entries', () => {
    recentFiles.addRecentFile('/tmp/first.md');
    recentFiles.addRecentFile('/tmp/second.md');

    recentFiles.removeRecentFile('/tmp/first.md');
    expect(recentFiles.getRecentFiles()).toEqual(['/tmp/second.md']);

    recentFiles.removeRecentFile('/tmp/not-there.md');
    expect(recentFiles.getRecentFiles()).toEqual(['/tmp/second.md']);
  });

  test('clearing the list empties history and notifies listeners', () => {
    const events = [];
    const unsubscribe = recentFiles.onRecentFilesChange((files) => {
      events.push(files);
    });

    recentFiles.addRecentFile('/tmp/sample.md');
    recentFiles.clearRecentFiles();

    expect(recentFiles.getRecentFiles()).toEqual([]);
    expect(events).toEqual([
      ['/tmp/sample.md'],
      [],
    ]);

    unsubscribe();
  });

  test('loads entries from disk during initialization', () => {
    const storagePath = createTempStoragePath();

    try {
      fs.writeFileSync(storagePath, JSON.stringify(['/tmp/persisted.md']), 'utf-8');
      recentFiles.initializeRecentFiles(storagePath);

      expect(recentFiles.getRecentFiles()).toEqual(['/tmp/persisted.md']);
    } finally {
      removeFile(storagePath);
    }
  });

  test('persists changes to the configured storage path', () => {
    const storagePath = createTempStoragePath();

    try {
      recentFiles.initializeRecentFiles(storagePath);
      recentFiles.addRecentFile('/tmp/a.md');
      recentFiles.addRecentFile('/tmp/b.md');
      recentFiles.removeRecentFile('/tmp/a.md');

      const persisted = JSON.parse(fs.readFileSync(storagePath, 'utf-8'));
      expect(persisted).toEqual(['/tmp/b.md']);
    } finally {
      removeFile(storagePath);
    }
  });
});
