const { createMarp } = require('../app/marp');
const marpPreviewEngine = require('../app/marpEngine');
const { FRAGMENT_CSS } = require('../app/fragments');

describe.each([
  ['preview', createMarp],
  ['export', marpPreviewEngine],
])('%s fragments', (_name, createEngine) => {
  function render(markdown, options = {}) {
    return createEngine({ inlineSVG: true, ...options }).render(markdown, {
      htmlAsArray: true,
    });
  }

  function hiddenCount(html) {
    return (html.match(/data-marp-preview-fragment-hidden/g) || []).length;
  }

  test.each(['* First\n* Second', '1) First\n2) Second'])(
    'expands the initial state and each reveal: %s',
    (list) => {
      const { html, comments, css } = render(`# Title\n\n${list}`);

      expect(html).toHaveLength(3);
      expect(comments).toHaveLength(3);
      expect(html.map(hiddenCount)).toEqual([2, 1, 0]);
      expect(css).toContain(FRAGMENT_CSS);
      html.forEach((slide, step) => {
        expect(slide).toContain(`data-marp-preview-fragment-step="${step}"`);
        expect(slide).toContain('First');
        expect(slide).toContain('Second');
        expect(slide).not.toContain('data-marpit-fragment');
      });
    },
  );

  test('keeps ordinary lists visible and ordinary slides as single pages', () => {
    const { html } = render(
      '# List\n\n- Always visible\n\n* Fragment\n\n---\n\n# Ordinary\n\n1. Item',
    );

    expect(html).toHaveLength(3);
    expect(html[0]).toContain('<li>Always visible</li>');
    expect(html[2]).toContain('<li>Item</li>');
    expect(html[2]).not.toContain('data-marp-preview-fragment-step');
  });

  test('reveals nested fragments in order and retains the full layout', () => {
    const { html } = render('* Parent\n  * Child\n* Sibling');

    expect(html).toHaveLength(4);
    expect(html.map(hiddenCount)).toEqual([3, 2, 1, 0]);
    html.forEach((slide) => {
      expect(slide).toContain('Parent');
      expect(slide).toContain('Child');
      expect(slide).toContain('Sibling');
    });
  });

  test('preserves original current and total page numbers in every stage', () => {
    const { html } = render(
      '---\npaginate: true\n---\n# First\n\n---\n\n# List\n\n* One\n* Two\n\n---\n\n# End',
    );

    expect(html).toHaveLength(5);
    expect(
      html.map((slide) => slide.match(/data-marpit-pagination="(\d+)"/)[1]),
    ).toEqual(['1', '2', '2', '2', '3']);
    html.forEach((slide) =>
      expect(slide).toContain('data-marpit-pagination-total="3"'),
    );
  });

  test('preserves paginate skip, hold and false directives', () => {
    const { html } = render(
      '---\npaginate: true\n---\n# First\n\n---\n\n<!-- _paginate: skip -->\n* Skip\n\n---\n\n<!-- _paginate: hold -->\n* Hold\n\n---\n\n<!-- _paginate: false -->\n* Hidden counter\n\n---\n\n# End',
    );

    expect(html).toHaveLength(8);
    expect(html[1]).not.toContain('data-marpit-pagination=');
    expect(html[2]).not.toContain('data-marpit-pagination=');
    expect(html[3]).toContain('data-marpit-pagination="1"');
    expect(html[4]).toContain('data-marpit-pagination="1"');
    expect(html[5]).not.toContain('data-marpit-pagination=');
    expect(html[6]).not.toContain('data-marpit-pagination=');
    expect(html[7]).toContain('data-marpit-pagination="3"');
    expect(html[7]).toContain('data-marpit-pagination-total="3"');
  });

  test('preserves local classes, scoped CSS, headers and footers', () => {
    const { html, css } = render(
      '---\nheader: Header\nfooter: Footer\n---\n<!-- _class: lead -->\n# List\n\n* First\n\n<style scoped>li { color: red; }</style>\n\n---\n\n# End',
    );
    const scope = html[0].match(/data-marpit-scope-\w+/)[0];

    expect(html).toHaveLength(3);
    expect(css).toContain(scope);
    for (const slide of html.slice(0, 2)) {
      expect(slide).toContain('class="lead"');
      expect(slide).toContain(scope);
      expect(slide).toContain('<header>Header</header>');
      expect(slide).toContain('<footer>Footer</footer>');
    }
    expect(html[2]).not.toContain('class="lead"');
  });

  test('expands headingDivider slides and preserves speaker notes', () => {
    const { html, comments } = render(
      '---\nheadingDivider: 2\n---\n# Title\n\n## List\n\n* First\n* Second\n\n<!-- Speaker note -->\n\n## End',
    );

    expect(html).toHaveLength(5);
    expect(comments.slice(1, 4)).toEqual([
      ['Speaker note'],
      ['Speaker note'],
      ['Speaker note'],
    ]);
  });

  test('gives repeated footnotes unique IDs and working links within each stage', () => {
    const { html } = render(
      '* First^[Note]\n* Second\n\n---\n\nOther^[Other note]',
    );
    const ids = html.flatMap((slide) =>
      Array.from(slide.matchAll(/\bid="([^"]+)"/g), (match) => match[1]),
    );

    expect(new Set(ids).size).toBe(ids.length);
    html.forEach((slide) => {
      const localIds = new Set(
        Array.from(slide.matchAll(/\bid="([^"]+)"/g), (match) => match[1]),
      );
      const links = Array.from(
        slide.matchAll(/href="#(fn[^"]+)"/g),
        (match) => match[1],
      );
      links.forEach((target) => expect(localIds.has(target)).toBe(true));
      expect(slide).toContain('>[1]</a>');
    });
  });

  test('remaps local anchors without colliding with existing slide IDs', () => {
    const { html } = render('* [Self](#slide)\n\n---\n\n# End', {
      anchor: (index) => (index === 0 ? 'slide' : 'slide-fragment-1'),
    });

    expect(html[0]).toContain('<section id="slide"');
    expect(html[0]).toContain('href="#slide"');
    expect(html[1]).toContain('<section id="slide-fragment-1-1"');
    expect(html[1]).toContain('href="#slide-fragment-1-1"');
    expect(html[2]).toContain('<section id="slide-fragment-1"');
  });

  test('preserves dimensions, split backgrounds, math and their page numbers', () => {
    const { html } = render(
      '---\nsize: 4:3\npaginate: true\n---\n![bg right:40%](https://example.com/background.png)\n\n* $x^2$\n* Second',
    );

    expect(html).toHaveLength(3);
    html.forEach((slide) => {
      expect(slide).toContain('viewBox="0 0 960 720"');
      expect(slide).toContain('data-marpit-advanced-background="background"');
      expect(slide).toContain('data-marpit-advanced-background="content"');
      expect(slide).toContain('data-marpit-advanced-background-split="right"');
      expect(slide).toContain('class="MathJax"');
      expect(slide.match(/data-marpit-pagination="1"/g)).toHaveLength(3);
      expect(slide.match(/data-marpit-pagination-total="1"/g)).toHaveLength(3);
    });
  });

  test('also expands bare HTML sections when inline SVG is disabled', () => {
    const { html } = render('* First\n* Second', {
      inlineSVG: false,
      container: false,
    });

    expect(html).toHaveLength(3);
    expect(html.map(hiddenCount)).toEqual([2, 1, 0]);
    expect(html[0]).toContain('<section id="1"');
    expect(html[0]).not.toContain('<svg');
  });

  test('does not leak fragments or pagination into the next render', () => {
    const engine = createEngine({ inlineSVG: true });
    expect(
      engine.render('---\npaginate: true\n---\n* First', { htmlAsArray: true })
        .html,
    ).toHaveLength(2);
    const { html } = engine.render('# Ordinary', { htmlAsArray: true });

    expect(html).toHaveLength(1);
    expect(html[0]).not.toContain('data-marp-preview-fragment-step');
    expect(html[0]).not.toContain('data-marpit-pagination=');
  });
});
