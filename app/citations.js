const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { Cite, plugins } = require('@citation-js/core');

require('@citation-js/plugin-bibtex');
require('@citation-js/plugin-csl');

const CITATION_BASE_PATH = 'citationBasePath';
const REFERENCES_MARKER = '<!-- references -->';
const REFERENCES_MARKER_RE = /<!--\s*references(?:\s*:\s*([1-9]\d*)?\s*-\s*([1-9]\d*)?)?\s*-->/gi;
const CITATION_CLUSTER_RE = /\[([^\[\]]*@[\w:.#$%&\-+?<>~/]+[^\[\]]*)\]/g;
const CITATION_KEY_RE = /^[A-Za-z0-9_:.#$%&\-+?<>~/]+$/;
const CITATION_METADATA_FIELDS = new Set(['bibliography', 'csl']);
const BUNDLED_CSL_LOCALES = new Map([
  ['ja', 'locales-ja-JP.xml'],
  ['ja-JP', 'locales-ja-JP.xml'],
  ['ja_JP', 'locales-ja-JP.xml'],
]);

const CITATION_CSS = `
section .citation {
  white-space: nowrap;
}

section .csl-bib-body {
  font-size: 0.62em;
  line-height: 1.25;
}

section .csl-entry {
  margin-bottom: 0.35em;
}

section .csl-left-margin {
  display: table-cell;
  padding-right: 0.4em;
  text-align: right;
  vertical-align: top;
  white-space: nowrap;
  width: 2.4em;
}

section .csl-right-inline {
  display: table-cell;
  vertical-align: top;
}
`.trim();

function parseTopLevelField(line, rootIndent) {
  if (line.trim() === '' || line.length < rootIndent) return null;
  const prefix = line.slice(0, rootIndent);
  if (!/^[ \t]*$/.test(prefix)) return null;

  const content = line.slice(rootIndent);
  if (/^[ \t]/.test(content)) return null;

  const match = content.match(/^(['"]?)([A-Za-z][\w-]*)\1\s*:/);
  return match ? match[2] : null;
}

function findRootIndent(lines) {
  const indents = lines
    .map((line) => {
      const match = line.match(/^([ \t]*)(['"]?)[A-Za-z][\w-]*\2\s*:/);
      return match ? match[1].length : null;
    })
    .filter((indent) => indent !== null);

  return indents.length > 0 ? Math.min(...indents) : 0;
}

function trimRootIndent(line, rootIndent) {
  if (line.trim() === '') return line;
  const prefix = line.slice(0, rootIndent);
  return /^[ \t]*$/.test(prefix) ? line.slice(rootIndent) : line;
}

function extractCitationMetadataYaml(source) {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const rootIndent = findRootIndent(lines);
  const citationLines = [];

  for (let index = 0; index < lines.length; index += 1) {
    const field = parseTopLevelField(lines[index], rootIndent);
    if (!CITATION_METADATA_FIELDS.has(field)) continue;

    citationLines.push(trimRootIndent(lines[index], rootIndent));
    for (index += 1; index < lines.length; index += 1) {
      const nextField = parseTopLevelField(lines[index], rootIndent);
      if (nextField) {
        index -= 1;
        break;
      }
      citationLines.push(trimRootIndent(lines[index], rootIndent));
    }
  }

  return citationLines.join('\n');
}

function parseCitationMetadata(markdown) {
  const source = markdown
    .replace(/^\uFEFF/, '')
    .replace(/^(?:[ \t]*\r?\n)+/, '');
  const yamlFrontMatter = source.match(
    /^---\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)\s*(?:\r?\n|$)/,
  );
  const htmlCommentDirectives =
    yamlFrontMatter ||
    source.match(/^<!--\s*\r?\n([\s\S]*?)\r?\n-->\s*(?:\r?\n|$)/);
  if (!htmlCommentDirectives) return {};

  try {
    const metadata = yaml.load(
      extractCitationMetadataYaml(htmlCommentDirectives[1]),
    ) || {};
    if (
      metadata &&
      typeof metadata === 'object' &&
      !Array.isArray(metadata)
    ) {
      return metadata;
    }
    return {};
  } catch (error) {
    throw new Error(`Failed to parse citation metadata: ${error.message}`);
  }
}

function normalizePathList(value, fieldName) {
  if (!value) {
    throw new Error(`Citation metadata requires '${fieldName}'.`);
  }

  const values = Array.isArray(value) ? value : [value];
  if (!values.every((item) => typeof item === 'string' && item.trim())) {
    throw new Error(`Citation metadata '${fieldName}' must be a path string.`);
  }

  return values;
}

function resolveMetadataPath(basePath, filePath) {
  return path.isAbsolute(filePath)
    ? filePath
    : path.resolve(basePath || process.cwd(), filePath);
}

function readMetadataFiles(basePath, paths, fieldName) {
  return paths
    .map((filePath) => {
      const resolvedPath = resolveMetadataPath(basePath, filePath);
      try {
        return fs.readFileSync(resolvedPath, 'utf-8');
      } catch (error) {
        throw new Error(
          `Failed to read citation ${fieldName} '${filePath}': ${error.message}`,
        );
      }
    })
    .join('\n');
}

function parseCitationItems(content) {
  const parts = content.split(';').map((part) => part.trim());
  if (parts.length === 0) return null;

  const items = [];
  for (const part of parts) {
    const match = part.match(/^@(.+)$/);
    if (!match || !CITATION_KEY_RE.test(match[1])) return null;
    items.push({ id: match[1] });
  }

  return items;
}

function escapeAttribute(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function extractCslLocales(csl) {
  const locales = new Set();
  for (const match of csl.matchAll(/\b(?:default-locale|locale)=["']([^"']+)["']/g)) {
    for (const locale of match[1].split(/\s+/)) {
      if (locale) locales.add(locale);
    }
  }
  return locales;
}

function registerBundledCslLocale(locales, locale) {
  const fileName = BUNDLED_CSL_LOCALES.get(locale);
  if (!fileName) return false;

  const localePath = path.join(__dirname, 'csl-locales', fileName);
  locales.add(locale, fs.readFileSync(localePath, 'utf-8'));
  return true;
}

function ensureCslLocales(csl) {
  const { locales } = plugins.config.get('@csl');

  for (const locale of extractCslLocales(csl)) {
    if (!locales.has(locale) && !registerBundledCslLocale(locales, locale)) {
      throw new Error(
        `CSL locale '${locale}' is not bundled with this app.`,
      );
    }
  }
}

function createStyleTemplate(csl) {
  const templates = plugins.config.get('@csl').templates;
  const hash = crypto.createHash('sha1').update(csl).digest('hex').slice(0, 12);
  const templateName = `marp-preview-${hash}`;

  ensureCslLocales(csl);
  if (!templates.has(templateName)) {
    templates.add(templateName, csl);
  }

  return templateName;
}

function createCitationContext(markdown, basePath) {
  const metadata = parseCitationMetadata(markdown);
  const bibliographyPaths = normalizePathList(
    metadata.bibliography,
    'bibliography',
  );
  const cslPaths = normalizePathList(metadata.csl, 'csl');
  if (cslPaths.length !== 1) {
    throw new Error("Citation metadata 'csl' must specify exactly one file.");
  }

  const bibliography = readMetadataFiles(
    basePath,
    bibliographyPaths,
    'bibliography',
  );
  const csl = readMetadataFiles(basePath, cslPaths, 'csl');

  return {
    cite: new Cite(bibliography),
    citedIds: [],
    template: createStyleTemplate(csl),
  };
}

function renderCitation(citationContext, items) {
  for (const item of items) {
    if (!citationContext.citedIds.includes(item.id)) {
      citationContext.citedIds.push(item.id);
    }
  }

  const citation = citationContext.cite.format('citation', {
    entry: {
      citationItems: items,
      properties: { noteIndex: 0 },
    },
    format: 'html',
    template: citationContext.template,
  });
  const cites = items.map((item) => item.id).join(' ');

  return `<span class="citation" data-cites="${escapeAttribute(cites)}">${citation}</span>`;
}

function renderBibliography(citationContext) {
  return citationContext.cite.format('bibliography', {
    entry: citationContext.citedIds,
    format: 'html',
    template: citationContext.template,
  });
}

function parseReferencesRange(from, to) {
  if (!from && !to) return null;

  const start = from ? Number.parseInt(from, 10) - 1 : 0;
  const end = to ? Number.parseInt(to, 10) : undefined;
  if (end !== undefined && start >= end) {
    throw new Error(`Invalid references range: ${from || ''}-${to || ''}`);
  }

  return { end, start };
}

function sliceBibliographyHtml(bibliographyHtml, range) {
  if (!range) return bibliographyHtml;

  const entryRe = /<div\b[^>]*class="[^"]*\bcsl-entry\b[^"]*"[^>]*>[\s\S]*?<\/div>/g;
  const entries = [...bibliographyHtml.matchAll(entryRe)].map(
    (match) => match[0],
  );
  const slicedEntries = entries.slice(range.start, range.end);

  if (entries.length === 0) return bibliographyHtml;

  return `<div class="csl-bib-body">\n  ${slicedEntries.join('\n  ')}\n</div>`;
}

function processCitations(markdown, options = {}) {
  const hasReferenceMarker = REFERENCES_MARKER_RE.test(markdown);
  REFERENCES_MARKER_RE.lastIndex = 0;
  const citationMatches = [...markdown.matchAll(CITATION_CLUSTER_RE)];
  const parsedMatches = citationMatches
    .map((match) => ({ content: match[1], items: parseCitationItems(match[1]) }))
    .filter((match) => match.items);

  if (parsedMatches.length === 0) return markdown;
  if (parsedMatches.length > 0 && !hasReferenceMarker) {
    throw new Error(
      `Citation references marker '${REFERENCES_MARKER}' is required.`,
    );
  }

  const citationContext = createCitationContext(markdown, options.basePath);
  const renderedMarkdown = markdown.replace(
    CITATION_CLUSTER_RE,
    (match, content) => {
      const items = parseCitationItems(content);
      if (!items) return match;
      return renderCitation(citationContext, items);
    },
  );
  const bibliography = renderBibliography(citationContext);

  return renderedMarkdown.replace(
    REFERENCES_MARKER_RE,
    (match, from, to) =>
      sliceBibliographyHtml(bibliography, parseReferencesRange(from, to)),
  );
}

function installCitations(marp) {
  const render = marp.render.bind(marp);
  marp.render = (markdown, env = {}) =>
    render(processCitations(markdown, { basePath: env[CITATION_BASE_PATH] }), env);

  const renderStyle = marp.renderStyle.bind(marp);
  marp.renderStyle = (theme) => `${renderStyle(theme)}\n${CITATION_CSS}`;

  return marp;
}

module.exports = {
  CITATION_BASE_PATH,
  CITATION_CSS,
  REFERENCES_MARKER,
  installCitations,
  parseCitationItems,
  processCitations,
};
