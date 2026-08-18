const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const SCIENCE_TOKYO_PACKAGE = 'marp-theme-science-tokyo';
const SCIENCE_TOKYO_THEME = 'science-tokyo';
const SCIENCE_TOKYO_THEME_NAMES = Object.freeze([
  'science-tokyo-base',
  'science-tokyo-a',
  'science-tokyo-b',
  'science-tokyo-c',
  'science-tokyo-d',
  SCIENCE_TOKYO_THEME,
]);
const SCIENCE_TOKYO_CSS_PATHS = new Map(
  SCIENCE_TOKYO_THEME_NAMES.map((themeName) => [
    themeName,
    require.resolve(`${SCIENCE_TOKYO_PACKAGE}/themes/${themeName}.css`),
  ]),
);
const SCIENCE_TOKYO_PACKAGE_ROOT = path.dirname(
  require.resolve(`${SCIENCE_TOKYO_PACKAGE}/package.json`),
);
const THEME_ASSET_URL_RE = /url\(\s*(["']?)(\.\/assets\/[^"'()]+)\1\s*\)/g;

const scienceTokyoCss = new Map();

function resolveUnpackedPath(filePath) {
  const asarSegment = `${path.sep}app.asar${path.sep}`;
  if (!filePath.includes(asarSegment)) return filePath;

  return filePath.replace(
    asarSegment,
    `${path.sep}app.asar.unpacked${path.sep}`,
  );
}

function resolveThemeAssetUrls(css, packageRoot) {
  return css.replace(
    THEME_ASSET_URL_RE,
    (original, _quote, relativeAssetPath) => {
      const assetPath = path.resolve(packageRoot, relativeAssetPath);
      const relativePath = path.relative(packageRoot, assetPath);

      if (
        relativePath.startsWith('..') ||
        path.isAbsolute(relativePath) ||
        !fs.existsSync(assetPath)
      ) {
        throw new Error(`Cannot resolve bundled theme asset: ${assetPath}`);
      }

      return `url("${pathToFileURL(resolveUnpackedPath(assetPath)).href}")`;
    },
  );
}

function loadScienceTokyoTheme(themeName = SCIENCE_TOKYO_THEME) {
  const cssPath = SCIENCE_TOKYO_CSS_PATHS.get(themeName);

  if (!cssPath) {
    throw new Error(`Unknown bundled Science Tokyo theme: ${themeName}`);
  }

  if (!scienceTokyoCss.has(themeName)) {
    const css = fs.readFileSync(cssPath, 'utf-8');
    scienceTokyoCss.set(
      themeName,
      resolveThemeAssetUrls(css, SCIENCE_TOKYO_PACKAGE_ROOT),
    );
  }

  return scienceTokyoCss.get(themeName);
}

function installBundledThemes(marp) {
  for (const themeName of SCIENCE_TOKYO_THEME_NAMES) {
    marp.themeSet.add(loadScienceTokyoTheme(themeName));
  }

  return marp;
}

module.exports = {
  installBundledThemes,
  loadScienceTokyoTheme,
  resolveThemeAssetUrls,
  resolveUnpackedPath,
};
