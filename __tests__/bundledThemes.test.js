const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const {
  loadScienceTokyoTheme,
  resolveThemeAssetUrls,
  resolveUnpackedPath,
} = require('../app/bundledThemes');
const { createMarp } = require('../app/marp');
const marpPreviewEngine = require('../app/marpEngine');

const packageRoot = path.dirname(
  require.resolve('marp-theme-science-tokyo/package.json'),
);

describe('bundled themes', () => {
  test('resolves Science Tokyo assets from the installed package', () => {
    const css = loadScienceTokyoTheme();
    const logoPath = path.join(
      packageRoot,
      'assets',
      'science-tokyo-logo.png',
    );

    expect(css).toContain('/* @theme science-tokyo */');
    expect(css).toContain(pathToFileURL(logoPath).href);
    expect(css).not.toContain('url("./assets/');
    expect(fs.existsSync(logoPath)).toBe(true);
  });

  test('rejects missing theme assets', () => {
    expect(() =>
      resolveThemeAssetUrls(
        'section { background: url("./assets/missing.png"); }',
        packageRoot,
      ),
    ).toThrow('Cannot resolve bundled theme asset');
  });

  test('maps packaged assets to the electron-builder unpacked directory', () => {
    const packagedPath = path.join(
      path.sep,
      'Applications',
      'Marp Preview.app',
      'Contents',
      'Resources',
      'app.asar',
      'node_modules',
      'marp-theme-science-tokyo',
      'assets',
      'logo.png',
    );

    expect(resolveUnpackedPath(packagedPath)).toContain(
      `${path.sep}app.asar.unpacked${path.sep}`,
    );
  });

  test.each([
    ['preview renderer', () => createMarp()],
    ['export engine', () => marpPreviewEngine({ inlineSVG: true })],
  ])('registers Science Tokyo in the %s', (_name, createRenderer) => {
    const marp = createRenderer();
    const { css } = marp.render(
      ['---', 'theme: science-tokyo', '---', '', '# Slide'].join('\n'),
    );

    expect(marp.themeSet.has('science-tokyo')).toBe(true);
    expect(css).toContain('--st-navy');
    expect(css).toContain('science-tokyo-logo.png');
  });
});
