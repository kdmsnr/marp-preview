const fs = require('fs');
const fsPromises = fs.promises;
const { randomUUID } = require('crypto');
const path = require('path');
const { dialog } = require('electron');
const marpCli = require('@marp-team/marp-cli');
const { loadDeck } = require('./deckLoader');
const { getCurrentFilePath, getMainWindow } = require('./state');

const enginePath = path.join(__dirname, 'marpEngine.js');

async function runMarpCLI(input, output) {
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

async function exportFile(format) {
  const currentFilePath = getCurrentFilePath();
  if (!currentFilePath) {
    dialog.showErrorBox('Export Error', 'No file is currently open to export.');
    return;
  }

  const mainWindow = getMainWindow();
  const defaultFileName = `${path.basename(currentFilePath, path.extname(currentFilePath))}.${format}`;
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultFileName,
    filters: [{ name: format.toUpperCase(), extensions: [format] }],
  });
  if (canceled || !filePath) return;

  let preparedInput;
  try {
    preparedInput = await prepareExportInput(currentFilePath);
    await runMarpCLI(preparedInput.inputPath, filePath);
    await fsPromises.access(filePath, fs.constants.R_OK);
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Export Successful',
      message: `File exported to:\n${filePath}`,
    });
  } catch (e) {
    dialog.showErrorBox('Export Failed', e.message);
  } finally {
    if (preparedInput?.temporary) {
      await fsPromises.unlink(preparedInput.inputPath).catch(() => {});
    }
  }
}

module.exports = {
  exportFile,
};
