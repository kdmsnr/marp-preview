const { Marp } = require('@marp-team/marp-core');
const { installFootnotes } = require('./footnotes');

function marpPreviewEngine(options = {}) {
  const marp = options.marp || new Marp(options);
  return installFootnotes(marp);
}

module.exports = marpPreviewEngine;
module.exports.default = marpPreviewEngine;
