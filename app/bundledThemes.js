const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const SCIENCE_TOKYO_PACKAGE = 'marp-theme-science-tokyo';
const SCIENCE_TOKYO_THEME = 'science-tokyo';
const SCIENCE_TOKYO_CSS_PATH = require.resolve(
  `${SCIENCE_TOKYO_PACKAGE}/themes/${SCIENCE_TOKYO_THEME}.css`,
);
const SCIENCE_TOKYO_PACKAGE_ROOT = path.dirname(
  require.resolve(`${SCIENCE_TOKYO_PACKAGE}/package.json`),
);
const THEME_ASSET_URL_RE =
  /url\(\s*(["']?)(\.\/assets\/[^"'()]+)\1\s*\)/g;

let scienceTokyoCss;

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

function loadScienceTokyoTheme() {
  if (scienceTokyoCss === undefined) {
    const css = fs.readFileSync(SCIENCE_TOKYO_CSS_PATH, 'utf-8');
    scienceTokyoCss = resolveThemeAssetUrls(
      css,
      SCIENCE_TOKYO_PACKAGE_ROOT,
    );
  }

  return scienceTokyoCss;
}

function installBundledThemes(marp) {
  marp.themeSet.add(loadScienceTokyoTheme());
  return marp;
}

module.exports = {
  installBundledThemes,
  loadScienceTokyoTheme,
  resolveThemeAssetUrls,
  resolveUnpackedPath,
};
