const fs = require('fs');
const path = require('path');
const { clipboard, dialog } = require('electron');
const { getCurrentFilePath } = require('./state');

const fsPromises = fs.promises;
const IMAGES_DIRECTORY = 'images';

function formatTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
}

async function writeUniqueImage(imagesDirectory, imageBuffer, timestamp) {
  for (let suffix = 1; ; suffix += 1) {
    const suffixText = suffix === 1 ? '' : `-${suffix}`;
    const fileName = `image-${timestamp}${suffixText}.png`;
    const filePath = path.join(imagesDirectory, fileName);

    try {
      await fsPromises.writeFile(filePath, imageBuffer, { flag: 'wx' });
      return { fileName, filePath };
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }
}

async function pasteClipboardImage() {
  const currentFilePath = getCurrentFilePath();
  if (!currentFilePath) {
    dialog.showErrorBox(
      'Paste Image Error',
      'Open a Markdown file before pasting an image.',
    );
    return null;
  }

  const image = clipboard.readImage();
  if (!image || image.isEmpty()) {
    dialog.showErrorBox(
      'Paste Image Error',
      'The clipboard does not contain an image.',
    );
    return null;
  }

  try {
    const imagesDirectory = path.join(
      path.dirname(currentFilePath),
      IMAGES_DIRECTORY,
    );
    await fsPromises.mkdir(imagesDirectory, { recursive: true });

    const savedImage = await writeUniqueImage(
      imagesDirectory,
      image.toPNG(),
      formatTimestamp(),
    );
    const markdown = `![image](${path.posix.join(
      IMAGES_DIRECTORY,
      savedImage.fileName,
    )})`;

    clipboard.writeText(markdown);
    return { filePath: savedImage.filePath, markdown };
  } catch (error) {
    console.error('Failed to paste clipboard image:', error);
    dialog.showErrorBox('Paste Image Error', error.message);
    return null;
  }
}

module.exports = {
  formatTimestamp,
  pasteClipboardImage,
  writeUniqueImage,
};
