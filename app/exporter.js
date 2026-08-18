const fs = require('fs');
const fsPromises = fs.promises;
const { randomUUID } = require('crypto');
const path = require('path');
const { dialog } = require('electron');
const marpCli = require('@marp-team/marp-cli');
const { loadDeck } = require('./deckLoader');
const { getCurrentFilePath } = require('./state');

const enginePath = path.join(__dirname, 'marpEngine.js');
let marpCliQueue = Promise.resolve();

async function runMarpCLIJob(input, output) {
  const previousCwd = process.cwd();
  try {
    process.chdir(path.dirname(input));
    const exitCode = await marpCli.marpCli([
      '--engine',
      enginePath,
      '--allow-local-files',
      path.basename(input),
      '-o',
      path.resolve(output),
    ]);
    if (exitCode !== 0) {
      throw new Error(`Marp CLI exited with code ${exitCode}`);
    }
  } finally {
    process.chdir(previousCwd);
  }
}

function runMarpCLI(input, output) {
  const job = marpCliQueue.then(() => runMarpCLIJob(input, output));
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

async function exportFile(window, format) {
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
  try {
    preparedInput = await prepareExportInput(currentFilePath);
    await runMarpCLI(preparedInput.inputPath, filePath);
    await fsPromises.access(filePath, fs.constants.R_OK);
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
    });
  } catch (error) {
    console.error('Failed to show the export confirmation:', error);
  }
}

module.exports = {
  exportFile,
};
