const fs = require('fs').promises;
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const run = promisify(execFile);

function ghostscriptCandidates() {
  if (process.env.MARP_PREVIEW_GHOSTSCRIPT) {
    return [process.env.MARP_PREVIEW_GHOSTSCRIPT];
  }
  if (process.platform === 'win32') {
    return ['gswin64c.exe', 'gswin32c.exe', 'gs.exe'];
  }
  // Finder-launched macOS apps do not inherit the shell's Homebrew PATH.
  return process.platform === 'darwin'
    ? ['gs', '/opt/homebrew/bin/gs', '/usr/local/bin/gs']
    : ['gs'];
}

async function compressPdf(inputPath, outputPath) {
  const args = [
    '-dSAFER',
    '-dBATCH',
    '-dNOPAUSE',
    '-dQUIET',
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.7',
    '-dAutoRotatePages=/None',
    '-dDetectDuplicateImages=true',
    '-dCompressFonts=true',
    '-dEmbedAllFonts=true',
    '-dSubsetFonts=true',
    '-dPreserveAnnots=true',
    '-dPreserveMarkedContent=true',
    '-dPassThroughJPEGImages=true',
    '-dPassThroughJPXImages=true',
    '-sColorConversionStrategy=LeaveColorUnchanged',
    '-dAutoFilterColorImages=false',
    '-dAutoFilterGrayImages=false',
    '-dColorImageFilter=/FlateEncode',
    '-dGrayImageFilter=/FlateEncode',
    '-dDownsampleColorImages=false',
    '-dDownsampleGrayImages=false',
    '-dDownsampleMonoImages=false',
    `-sOutputFile=${outputPath}`,
    '-c',
    // Keep all image pixels and use lossless compression. Existing JPEG/JPX
    // streams pass through when possible; never introduce new lossy encoding.
    '<< /NeverEmbed [] >> setdistillerparams',
    '-f',
    inputPath,
  ];

  for (const executable of ghostscriptCandidates()) {
    try {
      await run(executable, args, {
        cwd: path.dirname(inputPath),
        windowsHide: true,
        timeout: 120_000,
        maxBuffer: 1024 * 1024,
      });
      return true;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return false;
}

async function isCompletePdf(filePath, size) {
  const file = await fs.open(filePath, 'r');
  try {
    const header = Buffer.alloc(5);
    const tail = Buffer.alloc(Math.min(1024, size));
    await file.read(header, 0, header.length, 0);
    await file.read(tail, 0, tail.length, size - tail.length);
    return header.toString() === '%PDF-' && /%%EOF\s*$/.test(tail.toString());
  } finally {
    await file.close();
  }
}

async function optimizePdf(filePath) {
  let temporaryDirectory;
  let originalBytes;
  try {
    const inputPath = path.resolve(filePath);
    const original = await fs.stat(inputPath);
    originalBytes = original.size;
    // Keep the original intact until a complete, smaller PDF is ready.
    // A sibling directory also permits an atomic rename on the same volume.
    temporaryDirectory = await fs.mkdtemp(
      path.join(path.dirname(inputPath), '.marp-preview-pdf-'),
    );
    const outputPath = path.join(temporaryDirectory, 'optimized.pdf');
    if (!(await compressPdf(inputPath, outputPath))) {
      return { status: 'unavailable', originalBytes };
    }

    const optimized = await fs.stat(outputPath);
    if (!(await isCompletePdf(outputPath, optimized.size))) {
      throw new Error('PDF optimization produced an incomplete PDF.');
    }
    if (optimized.size >= originalBytes) {
      return { status: 'unchanged', originalBytes, finalBytes: originalBytes };
    }

    await fs.chmod(outputPath, original.mode);
    await fs.rename(outputPath, inputPath);
    return {
      status: 'optimized',
      originalBytes,
      finalBytes: optimized.size,
    };
  } catch (error) {
    return { status: 'failed', originalBytes, error };
  } finally {
    if (temporaryDirectory) {
      await fs
        .rm(temporaryDirectory, { recursive: true, force: true })
        .catch((error) =>
          console.warn('Failed to clean up PDF optimization:', error),
        );
    }
  }
}

module.exports = { optimizePdf };
