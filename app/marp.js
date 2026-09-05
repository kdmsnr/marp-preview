const { Marp } = require('@marp-team/marp-core');
const { installAdmonitions } = require('./admonitions');
const { installBundledThemes } = require('./bundledThemes');
const { installCitations } = require('./citations');
const { installFootnotes } = require('./footnotes');
const { installLocalImagePaths } = require('./localImagePaths');
const { installPagination } = require('./pagination');

function createMarp(options = { inlineSVG: true }) {
  const marp = new Marp(options);
  installBundledThemes(marp);
  installCitations(marp);
  installAdmonitions(marp);
  installFootnotes(marp);
  installLocalImagePaths(marp);
  installPagination(marp);
  return marp;
}

function getRenderedSlideSize(marp) {
  // Read the actual viewport: Marp restores the theme dimensions after render,
  // so reading themeSet here would miss directives such as `size: 4:3`.
  const viewport = marp.lastSlideTokens?.[0]?.find(
    (token) => token.type === 'marpit_inline_svg_content_open',
  );
  if (!viewport) return null;
  return {
    width: Number(viewport.attrGet('width')),
    height: Number(viewport.attrGet('height')),
  };
}

module.exports = {
  createMarp,
  getRenderedSlideSize,
};
