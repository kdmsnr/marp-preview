const { Marp } = require('@marp-team/marp-core');
const { installFootnotes } = require('./footnotes');

function createMarp(options = { inlineSVG: true }) {
  const marp = new Marp(options);
  installFootnotes(marp);
  return marp;
}

module.exports = {
  createMarp,
};
