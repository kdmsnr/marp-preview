const path = require('path');
const { pathToFileURL } = require('url');

const LOCAL_IMAGE_BASE_PATH = 'localImageBasePath';

function splitUrlSuffix(src) {
  const suffixStart = src.search(/[?#]/);
  if (suffixStart === -1) return [src, ''];
  return [src.slice(0, suffixStart), src.slice(suffixStart)];
}

function isExternalUrl(src) {
  if (/^[a-z]:[\\/]/i.test(src)) return false;

  return (
    /^[a-z][a-z\d+.-]*:/i.test(src) ||
    src.startsWith('//') ||
    src.startsWith('#')
  );
}

function resolveLocalImageUrl(src, basePath) {
  if (!src || !basePath || isExternalUrl(src)) return src;

  const [pathPart, suffix] = splitUrlSuffix(src);
  if (!pathPart) return src;

  let decodedPath = pathPart;
  try {
    decodedPath = decodeURI(pathPart);
  } catch {
    decodedPath = pathPart;
  }

  const filePath = path.isAbsolute(decodedPath)
    ? decodedPath
    : path.resolve(basePath, decodedPath);

  return `${pathToFileURL(filePath).href}${suffix}`;
}

function installLocalImagePaths(marp) {
  marp.markdown.inline.ruler2.after(
    'marpit_parse_image',
    'marp_preview_local_image_paths',
    (state) => {
      const basePath = state.env && state.env[LOCAL_IMAGE_BASE_PATH];
      if (!basePath) return;

      for (const token of state.tokens) {
        if (token.type !== 'image') continue;

        const src = token.attrGet('src');
        const resolvedSrc = resolveLocalImageUrl(src, basePath);
        token.attrSet('src', resolvedSrc);

        if (token.meta && token.meta.marpitImage) {
          token.meta.marpitImage.url = resolvedSrc;
        }
      }
    },
  );

  return marp;
}

module.exports = {
  LOCAL_IMAGE_BASE_PATH,
  installLocalImagePaths,
  resolveLocalImageUrl,
};
