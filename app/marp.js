const { Marp } = require('@marp-team/marp-core');
const { installFootnotes } = require('./footnotes');
const { installLocalImagePaths } = require('./localImagePaths');
const { installPagination } = require('./pagination');

function createMarp(options = { inlineSVG: true }) {
  const marp = new Marp(options);
  installFootnotes(marp);
  installLocalImagePaths(marp);
  installPagination(marp);
  return marp;
}

module.exports = {
  createMarp,
};
