const { ADMONITION_CSS, ADMONITIONS } = require('../app/admonitions');
const { createMarp } = require('../app/marp');
const marpPreviewEngine = require('../app/marpEngine');

const ADMONITION_CASES = Object.entries(ADMONITIONS).map(
  ([type, { icon, label, path }]) => ({ icon, label, path, type }),
);

describe('GitHub-style admonitions', () => {
  test.each(ADMONITION_CASES)(
    'renders $type with its GitHub title and icon',
    ({ icon, label, path, type }) => {
      const marp = createMarp({ inlineSVG: false });
      const { html } = marp.render(`> [!${type}]\n> ${type} body.`);

      expect(html).toContain(
        `<div class="markdown-alert markdown-alert-${type.toLowerCase()}">`,
      );
      expect(html).toContain(
        `<p class="markdown-alert-title" dir="auto"><svg data-component="Octicon" class="octicon octicon-${icon} mr-2"`,
      );
      expect(html).toContain(`aria-hidden="true"><path d="${path}"></path>`);
      expect(html).toContain(`</svg>${label}</p>`);
      expect(html).toContain(`<p>${type} body.</p>`);
      expect(html).not.toContain(`[!${type}]`);
    },
  );

  test('accepts lowercase markers and whitespace before the marker', () => {
    const marp = createMarp({ inlineSVG: false });
    const { html } = marp.render('>  [!note]\n> Lowercase body.');

    expect(html).toContain('<div class="markdown-alert markdown-alert-note">');
    expect(html).toContain('</svg>Note</p>');
    expect(html).toContain('<p>Lowercase body.</p>');
  });

  test.each([
    ['a trailing tab', '> [!NOTE]\t\n> Tab body.'],
    ['a hard break after the marker', '> [!NOTE]  \n> Hard break body.'],
    ['CRLF line endings', '> [!NOTE]\r\n> CRLF body.'],
  ])('accepts %s', (_description, markdown) => {
    const marp = createMarp({ inlineSVG: false });
    const { html } = marp.render(markdown);

    expect(html).toContain('<div class="markdown-alert markdown-alert-note">');
    expect(html).not.toContain('[!NOTE]');
  });

  test('keeps rich Markdown and multiple blocks in the body', () => {
    const marp = createMarp({ inlineSVG: false });
    const markdown = [
      '> [!TIP]',
      '> First **important** [link](https://example.com).',
      '>',
      '> Second paragraph.',
      '>',
      '> - First item',
      '> - Second item',
    ].join('\n');

    const { html } = marp.render(markdown);

    expect(html).toContain('First <strong>important</strong>');
    expect(html).toContain('<a href="https://example.com">link</a>');
    expect(html).toContain('<p>Second paragraph.</p>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>First item</li>');
  });

  test('supports a marker paragraph separated from its body', () => {
    const marp = createMarp({ inlineSVG: false });
    const { html } = marp.render('> [!NOTE]\n>\n> Later paragraph.');

    expect(html).toContain('<div class="markdown-alert markdown-alert-note">');
    expect(html).toContain('</svg>Note</p>\n<p>Later paragraph.</p>');
    expect(html).not.toContain('<p></p>');
  });

  test.each([
    ['ordinary blockquote', '> Quoted text.'],
    ['unknown marker', '> [!INFO]\n> Information.'],
    ['custom title', '> [!WARNING] Custom title\n> Warning.'],
    ['empty body', '> [!IMPORTANT]'],
    ['nested blockquote', '> Outer\n> > [!TIP]\n> > Nested.'],
    ['list item', '- Item\n  > [!CAUTION]\n  > Nested.'],
    [
      'details element',
      '<details>\n<summary>More</summary>\n\n> [!NOTE]\n> Nested.\n\n</details>',
    ],
    ['div element', '<div>\n\n> [!TIP]\n> Nested.\n\n</div>'],
    ['section element', '<section>\n\n> [!WARNING]\n> Nested.\n\n</section>'],
  ])('leaves %s unchanged', (_description, markdown) => {
    const marp = createMarp({ inlineSVG: false });
    const { html } = marp.render(markdown);

    expect(html).toContain('<blockquote>');
    expect(html).not.toContain('class="markdown-alert');
  });

  test('recognizes an alert after a closed HTML block', () => {
    const marp = createMarp({ inlineSVG: false });
    const markdown = '<div>Standalone HTML.</div>\n\n> [!NOTE]\n> Top level.';
    const { html } = marp.render(markdown);

    expect(html).toContain('<div>Standalone HTML.</div>');
    expect(html).toContain('<div class="markdown-alert markdown-alert-note">');
  });

  test('keeps multiple alerts and a normal blockquote separate', () => {
    const marp = createMarp({ inlineSVG: false });
    const markdown = [
      '> [!NOTE]',
      '> First alert.',
      '',
      '> Ordinary quote.',
      '',
      '> [!WARNING]',
      '> Second alert.',
    ].join('\n');
    const { html } = marp.render(markdown);

    expect(html.match(/class="markdown-alert markdown-alert-/g)).toHaveLength(
      2,
    );
    expect(html).toContain(
      '<blockquote>\n<p>Ordinary quote.</p>\n</blockquote>',
    );
  });

  test('works with slide-aware footnotes', () => {
    const marp = createMarp({ inlineSVG: false });
    const markdown = [
      '> [!NOTE]',
      '> Body with a footnote.[^note]',
      '',
      '[^note]: Footnote detail.',
    ].join('\n');

    const { html } = marp.render(markdown);

    expect(html).toContain('markdown-alert-note');
    expect(html).toContain('class="footnote-ref"');
    expect(html).toContain('Footnote detail.');
  });

  test.each([
    ['preview renderer', (options) => createMarp(options)],
    ['export engine', (options) => marpPreviewEngine(options)],
  ])('installs matching HTML and styles in the %s', (_name, factory) => {
    const marp = factory({ inlineSVG: true });
    const markdown = [
      '---',
      'theme: gaia',
      '---',
      '',
      '> [!CAUTION]',
      '> Back up the data first.',
    ].join('\n');

    const { css, html } = marp.render(markdown);

    expect(html).toContain(
      '<div class="markdown-alert markdown-alert-caution">',
    );
    expect(css).toContain(ADMONITION_CSS);
    expect(css).toContain('fill: currentColor !important;');
    expect(css).toContain('text-align: left !important;');
    expect(css).toContain(
      'section:where(.invert, .gaia, .title, .title-a) .markdown-alert',
    );
    expect(css).toContain(
      'background: color-mix(in srgb, Canvas 96%, var(--markdown-alert-color) 4%) !important;',
    );
    expect(css).toContain('light-dark(#cf222e, #f85149)');
  });
});
