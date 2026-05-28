const { Marp } = require('@marp-team/marp-core');
const { installFootnotes } = require('./footnotes');
const { installLocalImagePaths } = require('./localImagePaths');
const { installPagination } = require('./pagination');

function marpPreviewEngine(options = {}) {
  const marp = options.marp || new Marp(options);
  installFootnotes(marp);
  installLocalImagePaths(marp);
  return installPagination(marp);
}

module.exports = marpPreviewEngine;
module.exports.default = marpPreviewEngine;
