const fs = require('fs');
const fsPromises = fs.promises;
const { randomUUID } = require('crypto');
const path = require('path');
const { dialog } = require('electron');
const marpCli = require('@marp-team/marp-cli');
const { loadDeck } = require('./deckLoader');
const { getCurrentFilePath } = require('./state');
const { optimizePdf } = require('./pdfOptimizer');

const enginePath = path.join(__dirname, 'marpEngine.js');
let marpCliQueue = Promise.resolve();

async function runMarpCLIJob(input, output, optimize) {
  const outputPath = path.resolve(output);
  const previousCwd = process.cwd();
  try {
    process.chdir(path.dirname(input));
    const exitCode = await marpCli.marpCli([
      '--engine',
      enginePath,
      '--allow-local-files',
      path.basename(input),
      '-o',
      outputPath,
    ]);
    if (exitCode !== 0) {
      throw new Error(`Marp CLI exited with code ${exitCode}`);
    }
  } finally {
    process.chdir(previousCwd);
  }
  await fsPromises.access(outputPath, fs.constants.R_OK);
  if (optimize) return optimizePdf(outputPath);
}

function runMarpCLI(input, output, optimize) {
  const job = marpCliQueue.then(() => runMarpCLIJob(input, output, optimize));
  marpCliQueue = job.catch(() => {});
  return job;
}

function isUsableWindow(window) {
  return Boolean(window && !window.isDestroyed?.());
}

function showSaveDialog(window, options) {
  return isUsableWindow(window)
    ? dialog.showSaveDialog(window, options)
    : dialog.showSaveDialog(options);
}

function showMessageBox(window, options) {
  return isUsableWindow(window)
    ? dialog.showMessageBox(window, options)
    : dialog.showMessageBox(options);
}

async function prepareExportInput(input) {
  const deck = await loadDeck(input);
  if (deck.dependencies.length === 1) {
    return { inputPath: input, temporary: false };
  }

  const inputPath = path.join(
    path.dirname(input),
    `.marp-preview-${randomUUID()}.md`,
  );
  await fsPromises.writeFile(inputPath, deck.markdown, {
    encoding: 'utf-8',
    flag: 'wx',
  });

  return { inputPath, temporary: true };
}

function optimizationDetail(result) {
  if (!result) return undefined;
  if (result.status === 'optimized') {
    const formatSize = (bytes) =>
      bytes < 1024 * 1024
        ? `${(bytes / 1024).toFixed(1)} KiB`
        : `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
    const reduction = Math.round(
      (1 - result.finalBytes / result.originalBytes) * 100,
    );
    return `PDF optimized: ${formatSize(result.originalBytes)} → ${formatSize(result.finalBytes)} (${reduction}% smaller).`;
  }
  if (result.status === 'unchanged') {
    return 'The original PDF was kept because optimization did not reduce its size.';
  }
  if (result.status === 'unavailable') {
    return 'PDF saved at original quality. Install Ghostscript to enable automatic size optimization.';
  }
  console.warn(
    'PDF optimization failed; keeping the original PDF:',
    result.error,
  );
  return 'PDF saved at original quality because size optimization failed.';
}

async function exportFile(
  window,
  format,
  { optimizePdf: optimize = true } = {},
) {
  const currentFilePath = getCurrentFilePath(window);
  if (!currentFilePath) {
    dialog.showErrorBox('Export Error', 'No file is currently open to export.');
    return;
  }

  const defaultFileName = `${path.basename(currentFilePath, path.extname(currentFilePath))}.${format}`;
  let saveResult;
  try {
    saveResult = await showSaveDialog(window, {
      defaultPath: defaultFileName,
      filters: [{ name: format.toUpperCase(), extensions: [format] }],
    });
  } catch (error) {
    dialog.showErrorBox('Export Failed', error.message);
    return;
  }

  const { canceled, filePath } = saveResult;
  if (canceled || !filePath) return;

  let preparedInput;
  let optimization;
  try {
    preparedInput = await prepareExportInput(currentFilePath);
    optimization = await runMarpCLI(
      preparedInput.inputPath,
      filePath,
      format === 'pdf' && optimize,
    );
  } catch (e) {
    dialog.showErrorBox('Export Failed', e.message);
    return;
  } finally {
    if (preparedInput?.temporary) {
      await fsPromises.unlink(preparedInput.inputPath).catch(() => {});
    }
  }

  try {
    await showMessageBox(window, {
      type: 'info',
      title: 'Export Successful',
      message: `File exported to:\n${filePath}`,
      ...(optimization && { detail: optimizationDetail(optimization) }),
    });
  } catch (error) {
    console.error('Failed to show the export confirmation:', error);
  }
}

module.exports = {
  exportFile,
};
