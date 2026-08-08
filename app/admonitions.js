// Octicon SVG paths: Copyright GitHub, Inc. and contributors, MIT licensed.
// https://github.com/primer/octicons
const OCTICONS = Object.freeze({
  alert:
    'M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z',
  beaker:
    'M5 5.782V2.5h-.25a.75.75 0 0 1 0-1.5h6.5a.75.75 0 0 1 0 1.5H11v3.282l3.666 5.76C15.619 13.04 14.543 15 12.767 15H3.233c-1.776 0-2.852-1.96-1.899-3.458Zm-2.4 6.565a.75.75 0 0 0 .633 1.153h9.534a.75.75 0 0 0 .633-1.153L12.225 10.5h-8.45ZM9.5 2.5h-3V6c0 .143-.04.283-.117.403L4.73 9h6.54L9.617 6.403A.746.746 0 0 1 9.5 6Z',
  bug: 'M4.72.22a.75.75 0 0 1 1.06 0l1 .999a3.488 3.488 0 0 1 2.441 0l.999-1a.748.748 0 0 1 1.265.332.75.75 0 0 1-.205.729l-.775.776c.616.63.995 1.493.995 2.444v.327c0 .1-.009.197-.025.292.408.14.764.392 1.029.722l1.968-.787a.75.75 0 0 1 .556 1.392L13 7.258V9h2.25a.75.75 0 0 1 0 1.5H13v.5c0 .409-.049.806-.141 1.186l2.17.868a.75.75 0 0 1-.557 1.392l-2.184-.873A4.997 4.997 0 0 1 8 16a4.997 4.997 0 0 1-4.288-2.427l-2.183.873a.75.75 0 0 1-.558-1.392l2.17-.868A5.036 5.036 0 0 1 3 11v-.5H.75a.75.75 0 0 1 0-1.5H3V7.258L.971 6.446a.75.75 0 0 1 .558-1.392l1.967.787c.265-.33.62-.583 1.03-.722a1.677 1.677 0 0 1-.026-.292V4.5c0-.951.38-1.814.995-2.444L4.72 1.28a.75.75 0 0 1 0-1.06Zm.53 6.28a.75.75 0 0 0-.75.75V11a3.5 3.5 0 1 0 7 0V7.25a.75.75 0 0 0-.75-.75ZM6.173 5h3.654A.172.172 0 0 0 10 4.827V4.5a2 2 0 1 0-4 0v.327c0 .096.077.173.173.173Z',
  'check-circle':
    'M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm1.5 0a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm10.28-1.72-4.5 4.5a.75.75 0 0 1-1.06 0l-2-2a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018l1.47 1.47 3.97-3.97a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z',
  info: 'M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z',
  'light-bulb':
    'M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z',
  question:
    'M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.92 6.085h.001a.749.749 0 1 1-1.342-.67c.169-.339.436-.701.849-.977C6.845 4.16 7.369 4 8 4a2.756 2.756 0 0 1 1.637.525c.503.377.863.965.863 1.725 0 .448-.115.83-.329 1.15-.205.307-.47.513-.692.662-.109.072-.22.138-.313.195l-.006.004a6.24 6.24 0 0 0-.26.16.952.952 0 0 0-.276.245.75.75 0 0 1-1.248-.832c.184-.264.42-.489.692-.661.103-.067.207-.132.313-.195l.007-.004c.1-.061.182-.11.258-.161a.969.969 0 0 0 .277-.245C8.96 6.514 9 6.427 9 6.25a.612.612 0 0 0-.262-.525A1.27 1.27 0 0 0 8 5.5c-.369 0-.595.09-.74.187a1.01 1.01 0 0 0-.34.398ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z',
  quote:
    'M1.75 2.5h10.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5Zm4 5h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1 0-1.5Zm0 5h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1 0-1.5ZM2.5 7.75v6a.75.75 0 0 1-1.5 0v-6a.75.75 0 0 1 1.5 0Z',
  report:
    'M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z',
  stop: 'M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 2 0Z',
  'x-circle':
    'M2.344 2.343h-.001a8 8 0 0 1 11.314 11.314A8.002 8.002 0 0 1 .234 10.089a8 8 0 0 1 2.11-7.746Zm1.06 10.253a6.5 6.5 0 1 0 9.108-9.275 6.5 6.5 0 0 0-9.108 9.275ZM6.03 4.97 8 6.94l1.97-1.97a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l1.97 1.97a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-1.97 1.97a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L6.94 8 4.97 6.03a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018Z',
});

const ADMONITIONS = Object.freeze({
  NOTE: {
    icon: 'info',
    label: 'Note',
    path: OCTICONS.info,
  },
  ABSTRACT: {
    icon: 'report',
    label: 'Abstract',
    path: OCTICONS.report,
  },
  INFO: {
    icon: 'info',
    label: 'Info',
    path: OCTICONS.info,
  },
  TODO: {
    icon: 'check-circle',
    label: 'Todo',
    path: OCTICONS['check-circle'],
  },
  TIP: {
    icon: 'light-bulb',
    label: 'Tip',
    path: OCTICONS['light-bulb'],
  },
  IMPORTANT: {
    icon: 'report',
    label: 'Important',
    path: OCTICONS.report,
  },
  SUCCESS: {
    icon: 'check-circle',
    label: 'Success',
    path: OCTICONS['check-circle'],
  },
  QUESTION: {
    icon: 'question',
    label: 'Question',
    path: OCTICONS.question,
  },
  WARNING: {
    icon: 'alert',
    label: 'Warning',
    path: OCTICONS.alert,
  },
  CAUTION: {
    icon: 'stop',
    label: 'Caution',
    path: OCTICONS.stop,
  },
  FAILURE: {
    icon: 'x-circle',
    label: 'Failure',
    path: OCTICONS['x-circle'],
  },
  DANGER: {
    icon: 'stop',
    label: 'Danger',
    path: OCTICONS.stop,
  },
  BUG: {
    icon: 'bug',
    label: 'Bug',
    path: OCTICONS.bug,
  },
  EXAMPLE: {
    icon: 'beaker',
    label: 'Example',
    path: OCTICONS.beaker,
  },
  QUOTE: {
    icon: 'quote',
    label: 'Quote',
    path: OCTICONS.quote,
  },
});

const ADMONITION_ALIASES = Object.freeze({
  ATTENTION: 'WARNING',
  CHECK: 'SUCCESS',
  CITE: 'QUOTE',
  DONE: 'SUCCESS',
  ERROR: 'DANGER',
  FAIL: 'FAILURE',
  FAQ: 'QUESTION',
  HELP: 'QUESTION',
  HINT: 'TIP',
  MISSING: 'FAILURE',
  SUMMARY: 'ABSTRACT',
  TLDR: 'ABSTRACT',
});

const ADMONITION_MARKER_RE =
  /^\[!([A-Za-z0-9][A-Za-z0-9_-]*)\](?![+-])(?:[ \t]+([^\r\n]*?))?[ \t]*(?:\r?\n|$)/;

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
  background: color-mix(in srgb, var(--markdown-alert-color) 8%, transparent) !important;
  border-radius: 0.25em !important;
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

section .markdown-alert-title-text {
  min-width: 0;
}

section .markdown-alert a {
  color: var(--markdown-alert-color) !important;
}

section .markdown-alert li::marker {
  color: currentColor !important;
}

section .markdown-alert-note,
section .markdown-alert-info,
section .markdown-alert-todo {
  --markdown-alert-color: var(
    --fgColor-accent,
    light-dark(#0969da, #4493f8)
  );
}

section .markdown-alert-abstract {
  --markdown-alert-color: light-dark(#087f8c, #39c5cf);
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

section .markdown-alert-success {
  --markdown-alert-color: var(
    --fgColor-success,
    light-dark(#1a7f37, #3fb950)
  );
}

section .markdown-alert-question,
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

section .markdown-alert-failure,
section .markdown-alert-danger,
section .markdown-alert-bug {
  --markdown-alert-color: var(
    --fgColor-danger,
    light-dark(#cf222e, #f85149)
  );
}

section .markdown-alert-example {
  --markdown-alert-color: var(--fgColor-done, light-dark(#8250df, #ab7df8));
}

section .markdown-alert-quote {
  --markdown-alert-color: light-dark(#57606a, #8c959f);
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

function resolveAdmonitionType(identifier) {
  const type = identifier.toUpperCase();
  return ADMONITIONS[type] ? type : ADMONITION_ALIASES[type] || 'NOTE';
}

function titleCaseIdentifier(identifier) {
  return identifier
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ');
}

function createTitleTokens(state, type, title, level, map) {
  const open = new state.Token('admonition_title_open', 'p', 1);
  open.block = true;
  open.level = level;
  open.map = map ? [...map] : null;
  open.meta = { type };

  const inline = new state.Token('inline', '', 0);
  inline.block = true;
  inline.children = [];
  inline.content = title;
  inline.level = level + 1;
  inline.map = map ? [...map] : null;

  const close = new state.Token('admonition_title_close', 'p', -1);
  close.block = true;
  close.level = level;

  return [open, inline, close];
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

    const closeIndex = findBlockquoteClose(tokens, index);
    if (closeIndex < 0) continue;

    const identifier = markerMatch[1].toLowerCase();
    const bodyContent = inline.content.slice(markerMatch[0].length);
    const inlineHasBody = bodyContent.trim() !== '';
    const type = resolveAdmonitionType(identifier);
    const titleText = markerMatch[2]?.trim() || titleCaseIdentifier(identifier);

    open.tag = 'div';
    open.attrJoin('class', 'markdown-alert');
    open.attrJoin('class', `markdown-alert-${type.toLowerCase()}`);
    open.attrSet('data-callout', identifier);
    tokens[closeIndex].tag = 'div';

    inline.content = bodyContent;

    const titleTokens = createTitleTokens(
      state,
      type,
      titleText,
      open.level + 1,
      paragraphOpen.map,
    );
    if (inlineHasBody) {
      tokens.splice(index + 1, 0, ...titleTokens);
    } else {
      tokens.splice(index + 1, 3, ...titleTokens);
    }
  }
}

function renderTitleOpen(tokens, index) {
  const admonition = ADMONITIONS[tokens[index].meta.type];

  return [
    '<p class="markdown-alert-title" dir="auto">',
    `<svg data-component="Octicon" class="octicon octicon-${admonition.icon} mr-2" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true">`,
    `<path d="${admonition.path}"></path>`,
    '</svg><span class="markdown-alert-title-text">',
  ].join('');
}

function renderTitleClose() {
  return '</span></p>\n';
}

function installAdmonitions(marp) {
  marp.markdown.core.ruler.before(
    'inline',
    'marp_preview_admonitions',
    transformAdmonitions,
  );
  marp.markdown.renderer.rules.admonition_title_open = renderTitleOpen;
  marp.markdown.renderer.rules.admonition_title_close = renderTitleClose;

  const renderStyle = marp.renderStyle.bind(marp);
  marp.renderStyle = (theme) => `${renderStyle(theme)}\n${ADMONITION_CSS}`;

  return marp;
}

module.exports = {
  ADMONITION_ALIASES,
  ADMONITION_CSS,
  ADMONITIONS,
  installAdmonitions,
  transformAdmonitions,
  updateHtmlContainerStack,
};
