const { Marp } = require('@marp-team/marp-core');
const { installBundledThemes } = require('./bundledThemes');
const { installCitations } = require('./citations');
const { installFootnotes } = require('./footnotes');
const { installLocalImagePaths } = require('./localImagePaths');
const { installPagination } = require('./pagination');

function marpPreviewEngine(options = {}) {
  const marp = options.marp || new Marp(options);
  installBundledThemes(marp);
  installCitations(marp);
  installFootnotes(marp);
  installLocalImagePaths(marp);
  return installPagination(marp);
}

module.exports = marpPreviewEngine;
module.exports.default = marpPreviewEngine;
