// Octicon SVG paths: Copyright GitHub, Inc. and contributors, MIT licensed.
// https://github.com/primer/octicons
const ADMONITIONS = Object.freeze({
  NOTE: {
    icon: 'info',
    label: 'Note',
    path: 'M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z',
  },
  TIP: {
    icon: 'light-bulb',
    label: 'Tip',
    path: 'M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z',
  },
  IMPORTANT: {
    icon: 'report',
    label: 'Important',
    path: 'M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z',
  },
  WARNING: {
    icon: 'alert',
    label: 'Warning',
    path: 'M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z',
  },
  CAUTION: {
    icon: 'stop',
    label: 'Caution',
    path: 'M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 2 0Z',
  },
});

const ADMONITION_MARKER_RE = new RegExp(
  `^\\[!(${Object.keys(ADMONITIONS).join('|')})\\][ \\t]*(?:\\r?\\n|$)`,
  'i',
);

const VOID_HTML_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

const HTML_TAG_RE =
  /<!--[\s\S]*?-->|<\/?([A-Za-z][\w:-]*)(?:\s+(?:"[^"]*"|'[^']*'|[^'"<>])*)?\s*\/?>/g;

const ADMONITION_CSS = `
section .markdown-alert {
  box-sizing: border-box !important;
  margin: 1em 0 !important;
  padding: 0.5em 1em !important;
  border: 0 !important;
  border-left: 0.25em solid var(--markdown-alert-color) !important;
  background: transparent !important;
  color: inherit !important;
  text-align: left !important;
}

section:where(.invert, .gaia, .title, .title-a) .markdown-alert {
  background: Canvas !important;
  background: color-mix(in srgb, Canvas 96%, var(--markdown-alert-color) 4%) !important;
  color: CanvasText !important;
}

section .markdown-alert > p {
  text-align: left !important;
}

section .markdown-alert > :first-child {
  margin-top: 0 !important;
}

section .markdown-alert > :last-child {
  margin-bottom: 0 !important;
}

section .markdown-alert-title {
  display: flex !important;
  align-items: center !important;
  margin: 0 0 0.5em !important;
  color: var(--markdown-alert-color) !important;
  font-weight: 600 !important;
  line-height: 1 !important;
}

section .markdown-alert-title .octicon {
  width: 1em !important;
  height: 1em !important;
  margin-right: 0.5em !important;
  flex: 0 0 auto !important;
  fill: currentColor !important;
}

section .markdown-alert a {
  color: var(--markdown-alert-color) !important;
}

section .markdown-alert li::marker {
  color: currentColor !important;
}

section .markdown-alert-note {
  --markdown-alert-color: var(
    --fgColor-accent,
    light-dark(#0969da, #4493f8)
  );
}

section .markdown-alert-tip {
  --markdown-alert-color: var(
    --fgColor-success,
    light-dark(#1a7f37, #3fb950)
  );
}

section .markdown-alert-important {
  --markdown-alert-color: var(--fgColor-done, light-dark(#8250df, #ab7df8));
}

section .markdown-alert-warning {
  --markdown-alert-color: var(
    --fgColor-attention,
    light-dark(#9a6700, #d29922)
  );
}

section .markdown-alert-caution {
  --markdown-alert-color: var(
    --fgColor-danger,
    light-dark(#cf222e, #f85149)
  );
}
`.trim();

function findBlockquoteClose(tokens, openIndex) {
  let depth = 0;

  for (let index = openIndex; index < tokens.length; index += 1) {
    if (tokens[index].type === 'blockquote_open') depth += 1;
    if (tokens[index].type !== 'blockquote_close') continue;

    depth -= 1;
    if (depth === 0) return index;
  }

  return -1;
}

function hasInlineBody(children) {
  return children.some(
    (token) =>
      token.type !== 'softbreak' &&
      token.type !== 'hardbreak' &&
      (token.type !== 'text' || token.content.trim() !== ''),
  );
}

function createTitleToken(state, type, level, map) {
  const token = new state.Token('admonition_title', '', 0);
  token.block = true;
  token.level = level;
  token.map = map ? [...map] : null;
  token.meta = { type };
  return token;
}

function updateHtmlContainerStack(content, stack) {
  for (const match of content.matchAll(HTML_TAG_RE)) {
    if (!match[1]) continue;

    const tag = match[1].toLowerCase();
    const source = match[0];
    if (source.startsWith('</')) {
      const openIndex = stack.lastIndexOf(tag);
      if (openIndex >= 0) stack.splice(openIndex);
    } else if (!VOID_HTML_ELEMENTS.has(tag) && !/\/\s*>$/.test(source)) {
      stack.push(tag);
    }
  }
}

function transformAdmonitions(state) {
  const { tokens } = state;
  const htmlContainers = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const open = tokens[index];
    if (open.type === 'html_block') {
      updateHtmlContainerStack(open.content, htmlContainers);
      continue;
    }
    if (
      open.type !== 'blockquote_open' ||
      open.level !== 0 ||
      htmlContainers.length > 0
    ) {
      continue;
    }

    const paragraphOpen = tokens[index + 1];
    const inline = tokens[index + 2];
    const paragraphClose = tokens[index + 3];
    if (
      paragraphOpen?.type !== 'paragraph_open' ||
      inline?.type !== 'inline' ||
      paragraphClose?.type !== 'paragraph_close'
    ) {
      continue;
    }

    const markerMatch = inline.content.match(ADMONITION_MARKER_RE);
    if (!markerMatch) continue;

    const type = markerMatch[1].toUpperCase();
    const markerToken = inline.children?.[0];
    if (
      markerToken?.type !== 'text' ||
      markerToken.content.trimEnd().toUpperCase() !== `[!${type}]`
    ) {
      continue;
    }

    const closeIndex = findBlockquoteClose(tokens, index);
    if (closeIndex < 0) continue;

    const markerTokenCount = ['softbreak', 'hardbreak'].includes(
      inline.children[1]?.type,
    )
      ? 2
      : 1;
    const bodyChildren = inline.children.slice(markerTokenCount);
    const inlineHasBody = hasInlineBody(bodyChildren);
    const hasLaterBody = closeIndex > index + 4;
    if (!inlineHasBody && !hasLaterBody) continue;

    open.tag = 'div';
    open.attrJoin('class', 'markdown-alert');
    open.attrJoin('class', `markdown-alert-${type.toLowerCase()}`);
    tokens[closeIndex].tag = 'div';

    inline.children = bodyChildren;
    inline.content = inline.content.slice(markerMatch[0].length);

    const title = createTitleToken(
      state,
      type,
      open.level + 1,
      paragraphOpen.map,
    );
    if (inlineHasBody) {
      tokens.splice(index + 1, 0, title);
    } else {
      tokens.splice(index + 1, 3, title);
    }
  }
}

function renderTitle(tokens, index) {
  const admonition = ADMONITIONS[tokens[index].meta.type];

  return [
    '<p class="markdown-alert-title" dir="auto">',
    `<svg data-component="Octicon" class="octicon octicon-${admonition.icon} mr-2" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true">`,
    `<path d="${admonition.path}"></path>`,
    `</svg>${admonition.label}</p>\n`,
  ].join('');
}

function installAdmonitions(marp) {
  marp.markdown.core.ruler.after(
    'inline',
    'marp_preview_admonitions',
    transformAdmonitions,
  );
  marp.markdown.renderer.rules.admonition_title = renderTitle;

  const renderStyle = marp.renderStyle.bind(marp);
  marp.renderStyle = (theme) => `${renderStyle(theme)}\n${ADMONITION_CSS}`;

  return marp;
}

module.exports = {
  ADMONITION_CSS,
  ADMONITIONS,
  installAdmonitions,
  transformAdmonitions,
  updateHtmlContainerStack,
};
