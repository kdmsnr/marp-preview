const fs = require('fs');
const os = require('os');
const path = require('path');

const mockReadImage = jest.fn();
const mockWriteText = jest.fn();
const mockShowErrorBox = jest.fn();

jest.mock('electron', () => ({
  clipboard: {
    readImage: mockReadImage,
    writeText: mockWriteText,
  },
  dialog: {
    showErrorBox: mockShowErrorBox,
  },
}));

const mockGetCurrentFilePath = jest.fn();
jest.mock('../app/state', () => ({
  getCurrentFilePath: mockGetCurrentFilePath,
}));

const {
  formatTimestamp,
  pasteClipboardImage,
  writeUniqueImage,
} = require('../app/clipboardImage');

describe('clipboardImage', () => {
  const temporaryDirectories = [];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

  function createTemporaryDirectory() {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'marp-preview-'));
    temporaryDirectories.push(directory);
    return directory;
  }

  test('formats timestamps for image file names', () => {
    expect(formatTimestamp(new Date(2026, 6, 22, 9, 5, 7))).toBe(
      '20260722-090507',
    );
  });

  test('saves a clipboard image and copies its Markdown', async () => {
    const directory = createTemporaryDirectory();
    const imageBuffer = Buffer.from('png-data');
    mockGetCurrentFilePath.mockReturnValue(path.join(directory, 'slides.md'));
    mockReadImage.mockReturnValue({
      isEmpty: () => false,
      toPNG: () => imageBuffer,
    });

    const result = await pasteClipboardImage();

    expect(result.markdown).toMatch(
      /^!\[image\]\(images\/image-\d{8}-\d{6}\.png\)$/,
    );
    expect(mockWriteText).toHaveBeenCalledWith(result.markdown);
    expect(fs.readFileSync(result.filePath)).toEqual(imageBuffer);
    expect(path.dirname(result.filePath)).toBe(path.join(directory, 'images'));
  });

  test('adds a suffix when an image file name already exists', async () => {
    const directory = createTemporaryDirectory();
    const first = await writeUniqueImage(
      directory,
      Buffer.from('first'),
      '20260722-090507',
    );
    const second = await writeUniqueImage(
      directory,
      Buffer.from('second'),
      '20260722-090507',
    );

    expect(first.fileName).toBe('image-20260722-090507.png');
    expect(second.fileName).toBe('image-20260722-090507-2.png');
  });

  test('requires an open Markdown file', async () => {
    mockGetCurrentFilePath.mockReturnValue(null);

    await expect(pasteClipboardImage()).resolves.toBeNull();

    expect(mockReadImage).not.toHaveBeenCalled();
    expect(mockShowErrorBox).toHaveBeenCalledWith(
      'Paste Image Error',
      expect.stringContaining('Open a Markdown file'),
    );
  });

  test('requires an image on the clipboard', async () => {
    mockGetCurrentFilePath.mockReturnValue('/tmp/slides.md');
    mockReadImage.mockReturnValue({ isEmpty: () => true });

    await expect(pasteClipboardImage()).resolves.toBeNull();

    expect(mockWriteText).not.toHaveBeenCalled();
    expect(mockShowErrorBox).toHaveBeenCalledWith(
      'Paste Image Error',
      expect.stringContaining('does not contain an image'),
    );
  });
});
