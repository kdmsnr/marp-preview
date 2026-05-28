const PAGINATION_CSS = `
section[data-marpit-pagination]::after {
  content: attr(data-marpit-pagination) "/" attr(data-marpit-pagination-total) !important;
}
`.trim();

function installPagination(marp) {
  const renderStyle = marp.renderStyle.bind(marp);
  marp.renderStyle = (theme) => `${renderStyle(theme)}\n${PAGINATION_CSS}`;

  return marp;
}

module.exports = {
  PAGINATION_CSS,
  installPagination,
};
