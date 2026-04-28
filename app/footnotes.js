const footnotePlugin = require('markdown-it-footnote');

const FOOTNOTE_CSS = `
section .footnote-ref {
  font-size: 0.65em !important;
  font-weight: 600 !important;
  line-height: 0 !important;
  vertical-align: super !important;
}

section .footnote-ref a {
  color: inherit !important;
  text-decoration: none !important;
}

div.marpit > svg[data-marpit-svg] > foreignObject > section,
.marpit > .marpit-slide {
  position: relative !important;
}

section .footnotes {
  position: absolute !important;
  right: 2.5em !important;
  bottom: 5em !important;
  left: 2.5em !important;
  display: block !important;
  width: auto !important;
  height: auto !important;
  margin: 0 !important;
  padding: 0 !important;
  font-size: 0.45em !important;
  line-height: 1.25 !important;
  opacity: 0.82 !important;
  z-index: 1 !important;
}

section .footnotes-sep {
  width: 100% !important;
  height: 0 !important;
  margin: 0 0 0.35em !important;
  padding: 0 !important;
  border: 0 !important;
  border-top: 1px solid currentColor !important;
  background: transparent !important;
  opacity: 0.28 !important;
}

section .footnotes-list {
  margin: 0 !important;
  padding-left: 1.45em !important;
}

section .footnote-item {
  margin: 0.12em 0 !important;
}

section .footnote-item--plain {
  margin-left: -1.45em !important;
  padding-left: 0 !important;
  list-style: none !important;
}

section .footnote-item p {
  margin: 0 !important;
  font-size: inherit !important;
  line-height: inherit !important;
}

section .footnote-backref {
  display: none !important;
}
`.trim();

function cloneToken(token) {
  const cloned = Object.create(Object.getPrototypeOf(token));
  Object.assign(cloned, token);
  if (token.attrs) cloned.attrs = token.attrs.map((attr) => [...attr]);
  if (token.children) cloned.children = token.children.map(cloneToken);
  if (token.meta) cloned.meta = { ...token.meta };
  if (token.map) cloned.map = [...token.map];
  return cloned;
}

function collectReferenceTokens(state) {
  let current = [];
  let currentLabel;
  let currentSlideIndex = 0;
  let insideReference = false;
  let slideIndex = 0;
  const definitionsBySlide = new Map();
  const refTokens = {};

  state.tokens = state.tokens.filter((token) => {
    if (!insideReference && token.type === 'hr' && token.level === 0) {
      slideIndex += 1;
      return true;
    }

    if (token.type === 'footnote_reference_open') {
      insideReference = true;
      current = [];
      currentLabel = token.meta.label;
      currentSlideIndex = slideIndex;
      return false;
    }

    if (token.type === 'footnote_reference_close') {
      insideReference = false;
      refTokens[`:${currentLabel}`] = current;
      if (!definitionsBySlide.has(currentSlideIndex)) {
        definitionsBySlide.set(currentSlideIndex, []);
      }
      definitionsBySlide.get(currentSlideIndex).push(currentLabel);
      return false;
    }

    if (insideReference) {
      current.push(token);
      return false;
    }

    return true;
  });

  return { definitionsBySlide, refTokens };
}

function getFootnoteContentTokens(footnote, refTokens) {
  if (!footnote) return [];
  if (footnote.tokens) return footnote.tokens;
  if (footnote.label) return refTokens[`:${footnote.label}`] || [];
  return [];
}

function visitTokenTree(tokens, visitor) {
  for (const token of tokens) {
    visitor(token);
    if (token.children) visitTokenTree(token.children, visitor);
  }
}

function collectSlideFootnotes(slideTokens, list, refTokens) {
  const footnotes = new Map();
  const pending = [];

  const addReference = (token) => {
    if (token.type !== 'footnote_ref' || !token.meta) return;
    if (typeof token.meta.id !== 'number') return;

    const subId = typeof token.meta.subId === 'number' ? token.meta.subId : 0;
    if (!footnotes.has(token.meta.id)) {
      footnotes.set(token.meta.id, {
        number: footnotes.size,
        subIds: new Set(),
      });
      pending.push(token.meta.id);
    }

    token.meta.number = footnotes.get(token.meta.id).number;
    footnotes.get(token.meta.id).subIds.add(subId);
  };

  visitTokenTree(slideTokens, addReference);

  for (let index = 0; index < pending.length; index += 1) {
    const id = pending[index];
    const contentTokens = getFootnoteContentTokens(list[id], refTokens);

    visitTokenTree(contentTokens, addReference);
  }

  return footnotes;
}

function createInlineFootnoteTokens(state, footnote) {
  const tokenParagraphOpen = new state.Token('paragraph_open', 'p', 1);
  tokenParagraphOpen.block = true;

  const tokenInline = new state.Token('inline', '', 0);
  tokenInline.children = footnote.tokens.map(cloneToken);
  tokenInline.content = footnote.content;

  const tokenParagraphClose = new state.Token('paragraph_close', 'p', -1);
  tokenParagraphClose.block = true;

  return [tokenParagraphOpen, tokenInline, tokenParagraphClose];
}

function appendFootnoteItem(
  state,
  outputTokens,
  list,
  refTokens,
  id,
  number,
  subIds,
) {
  const footnote = list[id];
  if (!footnote) return;

  const tokenOpen = new state.Token('footnote_open', '', 1);
  tokenOpen.meta = { id, number, label: footnote.label };
  outputTokens.push(tokenOpen);

  const contentTokens = footnote.tokens
    ? createInlineFootnoteTokens(state, footnote)
    : getFootnoteContentTokens(footnote, refTokens).map(cloneToken);

  outputTokens.push(...contentTokens);

  let lastParagraph = null;
  if (outputTokens[outputTokens.length - 1].type === 'paragraph_close') {
    lastParagraph = outputTokens.pop();
  }

  [...subIds]
    .sort((a, b) => a - b)
    .forEach((subId) => {
      const tokenAnchor = new state.Token('footnote_anchor', '', 0);
      tokenAnchor.meta = { id, number, subId, label: footnote.label };
      outputTokens.push(tokenAnchor);
    });

  if (lastParagraph) outputTokens.push(lastParagraph);
  outputTokens.push(new state.Token('footnote_close', '', -1));
}

function appendPlainFootnoteItem(state, outputTokens, refTokens, label) {
  const contentTokens = getFootnoteContentTokens({ label }, refTokens).map(
    cloneToken,
  );
  if (contentTokens.length === 0) return;

  const tokenOpen = new state.Token('footnote_open', '', 1);
  tokenOpen.meta = { label, plain: true };
  outputTokens.push(tokenOpen);
  outputTokens.push(...contentTokens);
  outputTokens.push(new state.Token('footnote_close', '', -1));
}

function createFootnoteBlockTokens(
  state,
  slideFootnotes,
  list,
  refTokens,
  plainLabels,
) {
  const outputTokens = [new state.Token('footnote_block_open', '', 1)];

  for (const [id, { number, subIds }] of slideFootnotes) {
    appendFootnoteItem(state, outputTokens, list, refTokens, id, number, subIds);
  }

  for (const label of plainLabels) {
    appendPlainFootnoteItem(state, outputTokens, refTokens, label);
  }

  outputTokens.push(new state.Token('footnote_block_close', '', -1));
  return outputTokens;
}

function appendSlideFootnotes(
  state,
  outputTokens,
  slideTokens,
  list,
  refTokens,
  definedLabels,
) {
  outputTokens.push(...slideTokens);

  const slideFootnotes = collectSlideFootnotes(slideTokens, list, refTokens);
  const plainLabels = definedLabels.filter(
    (label) => state.env.footnotes.refs?.[`:${label}`] === -1,
  );
  if (slideFootnotes.size === 0 && plainLabels.length === 0) return;

  outputTokens.push(
    ...createFootnoteBlockTokens(
      state,
      slideFootnotes,
      list,
      refTokens,
      plainLabels,
    ),
  );
}

function slideAwareFootnoteTail(state) {
  if (!state.env.footnotes) return;

  const { definitionsBySlide, refTokens } = collectReferenceTokens(state);
  const list = state.env.footnotes.list || [];

  const outputTokens = [];
  let slideTokens = [];
  let slideIndex = 0;

  for (const token of state.tokens) {
    if (token.type === 'hr' && token.level === 0) {
      appendSlideFootnotes(
        state,
        outputTokens,
        slideTokens,
        list,
        refTokens,
        definitionsBySlide.get(slideIndex) || [],
      );
      outputTokens.push(token);
      slideTokens = [];
      slideIndex += 1;
    } else {
      slideTokens.push(token);
    }
  }

  appendSlideFootnotes(
    state,
    outputTokens,
    slideTokens,
    list,
    refTokens,
    definitionsBySlide.get(slideIndex) || [],
  );
  state.tokens = outputTokens;
}

function installFootnotes(marp) {
  marp.use(footnotePlugin);

  marp.markdown.core.ruler.at('footnote_tail', () => {});
  marp.markdown.core.ruler.after(
    'marpit_heading_divider',
    'marp_preview_footnote_tail',
    slideAwareFootnoteTail,
  );

  marp.markdown.renderer.rules.footnote_block_open = (tokens, idx, options) => {
    const hr = options.xhtmlOut
      ? '<hr class="footnotes-sep" />'
      : '<hr class="footnotes-sep">';

    return `<div class="footnotes">\n${hr}\n<ol class="footnotes-list">\n`;
  };
  marp.markdown.renderer.rules.footnote_block_close = () => '</ol>\n</div>\n';
  const renderFootnoteOpen = marp.markdown.renderer.rules.footnote_open;
  marp.markdown.renderer.rules.footnote_open = (
    tokens,
    idx,
    options,
    env,
    self,
  ) => {
    if (tokens[idx].meta?.plain) {
      return '<li class="footnote-item footnote-item--plain">';
    }

    return renderFootnoteOpen(tokens, idx, options, env, self);
  };
  marp.markdown.renderer.rules.footnote_caption = (tokens, idx) => {
    const meta = tokens[idx].meta || {};
    let number =
      typeof meta.number === 'number' ? meta.number + 1 : meta.id + 1;

    number = number.toString();
    if (meta.subId > 0) number += `:${meta.subId}`;

    return `[${number}]`;
  };

  const renderStyle = marp.renderStyle.bind(marp);
  marp.renderStyle = (theme) => `${renderStyle(theme)}\n${FOOTNOTE_CSS}`;

  return marp;
}

module.exports = {
  FOOTNOTE_CSS,
  installFootnotes,
  slideAwareFootnoteTail,
};
