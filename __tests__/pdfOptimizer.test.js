const fs = require('fs').promises;
const os = require('os');
const path = require('path');

const mockExecFile = jest.fn();
jest.mock('child_process', () => ({ execFile: mockExecFile }));

const { optimizePdf } = require('../app/pdfOptimizer');

// Minimal stand-ins exercise file replacement without depending on a locally
// installed Ghostscript. Real Marp PDFs are checked separately in integration QA.
function pdfBytes(size) {
  return Buffer.from(`%PDF-1.7\n${' '.repeat(size - 15)}\n%%EOF`);
}

describe('PDF optimization', () => {
  let directory;
  let inputPath;
  let previousExecutable;
  const original = pdfBytes(4096);

  beforeEach(async () => {
    jest.clearAllMocks();
    previousExecutable = process.env.MARP_PREVIEW_GHOSTSCRIPT;
    process.env.MARP_PREVIEW_GHOSTSCRIPT = '/test/Ghostscript/gs';
    directory = await fs.mkdtemp(path.join(os.tmpdir(), 'marp-pdf-test-'));
    inputPath = path.join(directory, '日本語 deck $(test).pdf');
    await fs.writeFile(inputPath, original);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    if (previousExecutable === undefined) {
      delete process.env.MARP_PREVIEW_GHOSTSCRIPT;
    } else {
      process.env.MARP_PREVIEW_GHOSTSCRIPT = previousExecutable;
    }
    await fs.rm(directory, { recursive: true, force: true });
  });

  function outputFromGhostscript(bytes) {
    mockExecFile.mockImplementation((_command, args, _options, callback) => {
      const outputPath = args
        .find((arg) => arg.startsWith('-sOutputFile='))
        .slice('-sOutputFile='.length);
      fs.writeFile(outputPath, bytes).then(
        () => callback(null, '', ''),
        callback,
      );
    });
  }

  async function expectOriginalPreserved() {
    expect(await fs.readFile(inputPath)).toEqual(original);
    expect(await fs.readdir(directory)).toEqual([path.basename(inputPath)]);
  }

  test('atomically replaces the PDF only with a smaller completed output', async () => {
    const smaller = pdfBytes(1024);
    await fs.chmod(inputPath, 0o640);
    outputFromGhostscript(smaller);

    expect(await optimizePdf(inputPath)).toEqual({
      status: 'optimized',
      originalBytes: original.length,
      finalBytes: smaller.length,
    });
    expect(await fs.readFile(inputPath)).toEqual(smaller);
    expect((await fs.stat(inputPath)).mode & 0o777).toBe(0o640);
    expect(await fs.readdir(directory)).toEqual([path.basename(inputPath)]);
    expect(mockExecFile).toHaveBeenCalledWith(
      '/test/Ghostscript/gs',
      expect.arrayContaining(['-dSAFER', '-f', inputPath]),
      expect.objectContaining({ timeout: 120_000, windowsHide: true }),
      expect.any(Function),
    );
    expect(mockExecFile.mock.calls[0][2].shell).toBeUndefined();
    expect(mockExecFile.mock.calls[0][1]).toEqual(
      expect.arrayContaining([
        '-dDownsampleColorImages=false',
        '-dDownsampleGrayImages=false',
        '-dDownsampleMonoImages=false',
        '-dAutoFilterColorImages=false',
        '-dAutoFilterGrayImages=false',
        '-dColorImageFilter=/FlateEncode',
        '-dGrayImageFilter=/FlateEncode',
        '-dPassThroughJPEGImages=true',
        '-dPassThroughJPXImages=true',
        '-sColorConversionStrategy=LeaveColorUnchanged',
      ]),
    );
  });

  test.each([4096, 8192])(
    'keeps the original when output has %i bytes',
    async (size) => {
      outputFromGhostscript(pdfBytes(size));

      expect(await optimizePdf(inputPath)).toMatchObject({
        status: 'unchanged',
      });
      await expectOriginalPreserved();
    },
  );

  test.each([
    Buffer.alloc(0),
    Buffer.from('not a PDF\n%%EOF'),
    Buffer.from('%PDF-1.7\ntruncated output'),
  ])('rejects empty or incomplete output %p', async (bytes) => {
    outputFromGhostscript(bytes);

    expect(await optimizePdf(inputPath)).toMatchObject({ status: 'failed' });
    await expectOriginalPreserved();
  });

  test('keeps the original when Ghostscript is not installed', async () => {
    mockExecFile.mockImplementation((_command, _args, _options, callback) => {
      callback(Object.assign(new Error('not found'), { code: 'ENOENT' }));
    });

    expect(await optimizePdf(inputPath)).toMatchObject({
      status: 'unavailable',
    });
    await expectOriginalPreserved();
  });

  test('finds Homebrew Ghostscript when a Finder app has a minimal PATH', async () => {
    delete process.env.MARP_PREVIEW_GHOSTSCRIPT;
    const platform = Object.getOwnPropertyDescriptor(process, 'platform');
    Object.defineProperty(process, 'platform', {
      ...platform,
      value: 'darwin',
    });
    outputFromGhostscript(pdfBytes(1024));
    mockExecFile.mockImplementationOnce(
      (_command, _args, _options, callback) => {
        callback(Object.assign(new Error('not found'), { code: 'ENOENT' }));
      },
    );

    try {
      expect(await optimizePdf(inputPath)).toMatchObject({
        status: 'optimized',
      });
      expect(mockExecFile.mock.calls.map(([command]) => command)).toEqual([
        'gs',
        '/opt/homebrew/bin/gs',
      ]);
    } finally {
      Object.defineProperty(process, 'platform', platform);
    }
  });

  test.each([
    Object.assign(new Error('conversion failed'), { code: 1 }),
    Object.assign(new Error('timed out'), { killed: true, signal: 'SIGTERM' }),
  ])('keeps the original on a process failure: %s', async (error) => {
    mockExecFile.mockImplementation((_command, _args, _options, callback) => {
      callback(error);
    });

    expect(await optimizePdf(inputPath)).toMatchObject({
      status: 'failed',
      error,
    });
    await expectOriginalPreserved();
    expect(mockExecFile).toHaveBeenCalledTimes(1);
  });

  test('keeps the original and cleans up if replacement fails', async () => {
    outputFromGhostscript(pdfBytes(1024));
    jest.spyOn(fs, 'rename').mockRejectedValue(new Error('permission denied'));

    expect(await optimizePdf(inputPath)).toMatchObject({ status: 'failed' });
    await expectOriginalPreserved();
  });
});
