const { FOOTNOTE_CSS } = require('../app/footnotes');
const { createMarp } = require('../app/marp');
const marpPreviewEngine = require('../app/marpEngine');

describe('createMarp', () => {
  test('constructs Marp with inline SVG enabled by default', () => {
    const marp = createMarp();

    expect(marp.options.inlineSVG).toBe(true);
  });

  test('renders footnotes on the slide where they are referenced', () => {
    const marp = createMarp();
    const markdown = [
      '# First',
      '',
      'Text with a footnote.[^first]',
      '',
      '[^first]: First slide note.',
      '',
      '---',
      '',
      '# Second',
      '',
      'No footnote here.',
    ].join('\n');

    const { html } = marp.render(markdown, { htmlAsArray: true });

    expect(html[0]).toContain('<div class="footnotes">');
    expect(html[0]).toContain('<hr class="footnotes-sep" />');
    expect(html[0]).toContain('First slide note.');
    expect(html[1]).not.toContain('First slide note.');
  });

  test('renders footnotes on headingDivider-created pages', () => {
    const marp = createMarp();
    const markdown = [
      '<!--',
      'headingDivider: 2',
      '-->',
      '',
      '# Title',
      '',
      '## Footnote page',
      '',
      'test[^id]',
      '',
      '[^id]: note',
      '',
      '## Next page',
      '',
      'No note here.',
    ].join('\n');

    const { html } = marp.render(markdown, { htmlAsArray: true });

    expect(html[1]).toContain('<div class="footnotes">');
    expect(html[1]).toContain('note ');
    expect(html[2]).not.toContain('<div class="footnotes">');
  });

  test('resets visible footnote numbers on each page', () => {
    const marp = createMarp();
    const markdown = [
      '# First',
      '',
      'First note[^first]',
      '',
      '[^first]: First page note.',
      '',
      '---',
      '',
      '# Second',
      '',
      'Second note[^second]',
      '',
      '[^second]: Second page note.',
    ].join('\n');

    const { html } = marp.render(markdown, { htmlAsArray: true });

    expect(html[0]).toContain('id="fnref1">[1]</a>');
    expect(html[0]).toContain('<li id="fn1" class="footnote-item">');
    expect(html[1]).toContain('id="fnref2">[1]</a>');
    expect(html[1]).toContain('<li id="fn2" class="footnote-item">');
  });

  test('renders unreferenced footnote definitions as plain page notes', () => {
    const marp = createMarp();
    const { html } = marp.render('## Footnote only\n\n[^id]: note');

    expect(html).toContain('<div class="footnotes">');
    expect(html).toContain(
      '<li class="footnote-item footnote-item--plain"><p>note</p>',
    );
    expect(html).not.toContain('class="footnote-ref"');
    expect(html).not.toContain('id="fn1"');
  });

  test('renders unreferenced footnote definitions on headingDivider pages', () => {
    const marp = createMarp();
    const markdown = [
      '<!--',
      'headingDivider: 2',
      '-->',
      '',
      '# Title',
      '',
      '## Footnote only',
      '',
      '[^id]: note',
      '',
      '## Next page',
      '',
      'No note here.',
    ].join('\n');

    const { html } = marp.render(markdown, { htmlAsArray: true });

    expect(html[1]).toContain('footnote-item--plain');
    expect(html[1]).toContain('<p>note</p>');
    expect(html[2]).not.toContain('footnote-item--plain');
  });

  test('renders standard footnote definitions visibly inside a slide', () => {
    const marp = createMarp();
    const { html } = marp.render('test[^id]\n\n[^id]: note');

    expect(html).toContain('test<sup class="footnote-ref"');
    expect(html).toContain('<div class="footnotes">\n<hr class="footnotes-sep" />');
    expect(html).not.toContain('<section class="footnotes">');
    expect(html).toContain('note ');
  });

  test('includes footnote styles in rendered CSS', () => {
    const marp = createMarp();
    const { css } = marp.render('# Slide');

    expect(css).toContain(FOOTNOTE_CSS);
    expect(css).toContain('position: absolute !important;');
    expect(css).not.toContain(':has(.footnotes)');
    expect(css).toContain('position: relative !important;');
  });

  test('exports a Marp CLI engine that creates a renderer from CLI options', () => {
    const marp = marpPreviewEngine({ inlineSVG: true });
    const { html } = marp.render('Export footnote^[Export note.]');

    expect(html).toContain('Export note.');
  });
});
