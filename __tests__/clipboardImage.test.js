const fs = require('fs');
const os = require('os');
const path = require('path');

const mockReadImage = jest.fn();
const mockWriteText = jest.fn();
const mockShowErrorBox = jest.fn();
const mockCreateFromBuffer = jest.fn();

jest.mock('electron', () => ({
  clipboard: {
    readImage: mockReadImage,
    writeText: mockWriteText,
  },
  dialog: {
    showErrorBox: mockShowErrorBox,
  },
  nativeImage: { createFromBuffer: mockCreateFromBuffer },
}));

const mockGetCurrentFilePath = jest.fn();
const mockGetSlideSize = jest.fn();
jest.mock('../app/state', () => ({
  getCurrentFilePath: mockGetCurrentFilePath,
  getSlideSize: mockGetSlideSize,
}));

const {
  formatTimestamp,
  pasteClipboardImage,
  writeUniqueImage,
} = require('../app/clipboardImage');

describe('clipboardImage', () => {
  const targetWindow = { id: 'target-window' };
  const temporaryDirectories = [];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSlideSize.mockReturnValue({ width: 1280, height: 720 });
    mockCreateFromBuffer.mockReturnValue({
      getSize: () => ({ width: 640, height: 480 }),
      resize: jest.fn(),
    });
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

    const result = await pasteClipboardImage(targetWindow);

    expect(mockGetCurrentFilePath).toHaveBeenCalledWith(targetWindow);
    expect(result.markdown).toMatch(
      /^!\[image\]\(images\/image-\d{8}-\d{6}\.png\)$/,
    );
    expect(mockWriteText).toHaveBeenCalledWith(result.markdown);
    expect(fs.readFileSync(result.filePath)).toEqual(imageBuffer);
    expect(path.dirname(result.filePath)).toBe(path.join(directory, 'images'));
    expect(
      mockCreateFromBuffer.mock.results[0].value.resize,
    ).not.toHaveBeenCalled();
  });

  test.each([
    [3840, 2160, 1280, 720],
    [4000, 1000, 1280, 320],
    [1000, 4000, 180, 720],
    [2000, 2000, 720, 720],
    [1281, 720, 1280, 719],
    [1, 4000, 1, 720],
  ])(
    'silently fits a %i×%i image into the slide',
    async (width, height, savedWidth, savedHeight) => {
      const directory = createTemporaryDirectory();
      const originalPng = Buffer.from('original-png');
      const resizedPng = Buffer.from('resized-png');
      const resize = jest.fn(() => ({ toPNG: () => resizedPng }));
      mockGetCurrentFilePath.mockReturnValue(path.join(directory, 'slides.md'));
      mockReadImage.mockReturnValue({
        isEmpty: () => false,
        toPNG: () => originalPng,
      });
      mockCreateFromBuffer.mockReturnValue({
        getSize: () => ({ width, height }),
        resize,
      });

      const result = await pasteClipboardImage(targetWindow);

      expect(mockCreateFromBuffer).toHaveBeenCalledWith(originalPng);
      expect(mockGetSlideSize).toHaveBeenCalledWith(targetWindow);
      expect(resize).toHaveBeenCalledWith({
        width: savedWidth,
        height: savedHeight,
        quality: 'best',
      });
      expect(fs.readFileSync(result.filePath)).toEqual(resizedPng);
      expect(mockWriteText).toHaveBeenCalledWith(result.markdown);
      expect(mockShowErrorBox).not.toHaveBeenCalled();
    },
  );

  test('uses the target deck dimensions instead of the default widescreen size', async () => {
    const directory = createTemporaryDirectory();
    const resize = jest.fn(() => ({ toPNG: () => Buffer.from('four-three') }));
    mockGetCurrentFilePath.mockReturnValue(path.join(directory, 'slides.md'));
    mockGetSlideSize.mockReturnValue({ width: 960, height: 720 });
    mockReadImage.mockReturnValue({
      isEmpty: () => false,
      toPNG: () => Buffer.from('original'),
    });
    mockCreateFromBuffer.mockReturnValue({
      getSize: () => ({ width: 1280, height: 720 }),
      resize,
    });

    await pasteClipboardImage(targetWindow);

    expect(resize).toHaveBeenCalledWith({
      width: 960,
      height: 540,
      quality: 'best',
    });
  });

  test('does not resize an image exactly matching the slide dimensions', async () => {
    const directory = createTemporaryDirectory();
    const png = Buffer.from('slide-sized');
    const resize = jest.fn();
    mockGetCurrentFilePath.mockReturnValue(path.join(directory, 'slides.md'));
    mockReadImage.mockReturnValue({ isEmpty: () => false, toPNG: () => png });
    mockCreateFromBuffer.mockReturnValue({
      getSize: () => ({ width: 1280, height: 720 }),
      resize,
    });

    const result = await pasteClipboardImage(targetWindow);

    expect(resize).not.toHaveBeenCalled();
    expect(fs.readFileSync(result.filePath)).toEqual(png);
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

    await expect(pasteClipboardImage(targetWindow)).resolves.toBeNull();

    expect(mockGetCurrentFilePath).toHaveBeenCalledWith(targetWindow);
    expect(mockReadImage).not.toHaveBeenCalled();
    expect(mockShowErrorBox).toHaveBeenCalledWith(
      'Paste Image Error',
      expect.stringContaining('Open a Markdown file'),
    );
  });

  test('requires an image on the clipboard', async () => {
    mockGetCurrentFilePath.mockReturnValue('/tmp/slides.md');
    mockReadImage.mockReturnValue({ isEmpty: () => true });

    await expect(pasteClipboardImage(targetWindow)).resolves.toBeNull();

    expect(mockGetCurrentFilePath).toHaveBeenCalledWith(targetWindow);
    expect(mockWriteText).not.toHaveBeenCalled();
    expect(mockShowErrorBox).toHaveBeenCalledWith(
      'Paste Image Error',
      expect.stringContaining('does not contain an image'),
    );
  });
});
