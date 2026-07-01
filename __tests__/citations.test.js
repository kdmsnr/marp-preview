const fs = require('fs');
const os = require('os');
const path = require('path');
const { plugins } = require('@citation-js/core');

require('@citation-js/plugin-csl');

const {
  CITATION_CSS,
  processCitations,
  parseCitationItems,
} = require('../app/citations');
const { createMarp } = require('../app/marp');

const APA_CSL = plugins.config.get('@csl').templates.get('apa');
const IEEE_CSL = `<?xml version="1.0" encoding="utf-8"?>
<style xmlns="http://purl.org/net/xbiblio/csl" version="1.0" class="in-text">
  <info>
    <title>Test IEEE</title>
    <id>test-ieee</id>
    <updated>2026-01-01T00:00:00+00:00</updated>
  </info>
  <citation collapse="citation-number">
    <sort>
      <key variable="citation-number"/>
    </sort>
    <layout delimiter=", " prefix="[" suffix="]">
      <text variable="citation-number"/>
    </layout>
  </citation>
  <bibliography second-field-align="flush">
    <layout>
      <text variable="citation-number" prefix="[" suffix="]"/>
      <group delimiter=", ">
        <names variable="author">
          <name initialize-with=". "/>
        </names>
        <text variable="title" quotes="true"/>
      </group>
    </layout>
  </bibliography>
</style>`;
const JA_CSL = `<?xml version="1.0" encoding="utf-8"?>
<style xmlns="http://purl.org/net/xbiblio/csl" version="1.0" class="in-text" default-locale="ja-JP">
  <info>
    <title>Test Japanese Locale</title>
    <id>test-japanese-locale</id>
    <updated>2026-01-01T00:00:00+00:00</updated>
  </info>
  <citation>
    <layout prefix="(" suffix=")">
      <text macro="author"/>
      <date variable="issued">
        <date-part name="year"/>
      </date>
    </layout>
  </citation>
  <bibliography>
    <layout>
      <text macro="author"/>
      <text variable="title" prefix=". "/>
      <text term="accessed" prefix=". "/>
    </layout>
  </bibliography>
  <macro name="author">
    <names variable="author">
      <name/>
      <substitute>
        <text variable="title"/>
      </substitute>
    </names>
  </macro>
</style>`;
const BIBTEX = `
@book{beck2000,
  title = {Extreme Programming Explained},
  author = {Beck, Kent},
  year = {2000},
  publisher = {Addison-Wesley}
}

@book{fowler2018,
  title = {Refactoring},
  author = {Fowler, Martin},
  year = {2018},
  publisher = {Addison-Wesley}
}
`.trim();

function createCitationFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'marp-preview-citations-'));
  const deckDir = path.join(root, 'slides');
  fs.mkdirSync(deckDir);
  fs.writeFileSync(path.join(root, 'ref.bib'), BIBTEX);
  fs.writeFileSync(path.join(root, 'apa.csl'), APA_CSL);
  fs.writeFileSync(path.join(root, 'ieee.csl'), IEEE_CSL);
  fs.writeFileSync(path.join(root, 'ja.csl'), JA_CSL);

  return { deckDir, root };
}

describe('citations', () => {
  let fixture;

  afterEach(() => {
    if (fixture) fs.rmSync(fixture.root, { force: true, recursive: true });
    fixture = undefined;
  });

  test('parses basic citation clusters', () => {
    expect(parseCitationItems('@beck2000; @fowler2018')).toEqual([
      { id: 'beck2000' },
      { id: 'fowler2018' },
    ]);
    expect(parseCitationItems('see @beck2000')).toBeNull();
  });

  test('renders citations and references with BibTeX and CSL files', () => {
    fixture = createCitationFixture();
    const markdown = [
      '---',
      'bibliography: ../ref.bib',
      'csl: ../apa.csl',
      '---',
      '',
      'Kent Beck wrote about XP [@beck2000].',
      '',
      '# References',
      '',
      '<!-- references -->',
    ].join('\n');

    const rendered = processCitations(markdown, { basePath: fixture.deckDir });

    expect(rendered).toContain('<span class="citation"');
    expect(rendered).toContain('(Beck, 2000)');
    expect(rendered).toContain('data-csl-entry-id="beck2000"');
    expect(rendered).toContain('<i>Extreme Programming Explained</i>');
    expect(rendered).not.toContain('<!-- references -->');
  });

  test('renders bibliography URLs as hyperlinks', () => {
    fixture = createCitationFixture();
    fs.writeFileSync(
      path.join(fixture.root, 'web.bib'),
      `
@misc{site2024,
  author = {Doe, Jane},
  title = {Example Site},
  year = {2024},
  url = {https://example.com}
}
`.trim(),
    );
    const markdown = [
      '---',
      'bibliography: ../web.bib',
      'csl: ../apa.csl',
      '---',
      '',
      'Jane Doe published a website [@site2024].',
      '',
      '# References',
      '',
      '<!-- references -->',
    ].join('\n');

    const rendered = processCitations(markdown, { basePath: fixture.deckDir });

    expect(rendered).toContain(
      '<a href="https://example.com">https://example.com</a>',
    );
  });

  test('reads citation metadata from Marp HTML comment directives', () => {
    fixture = createCitationFixture();
    const markdown = [
      '<!--',
      'marp: true',
      'bibliography: ../ref.bib',
      'csl: ../apa.csl',
      '-->',
      '',
      'Kent Beck wrote about XP [@beck2000].',
      '',
      '<!-- references -->',
    ].join('\n');

    const rendered = processCitations(markdown, { basePath: fixture.deckDir });

    expect(rendered).toContain('(Beck, 2000)');
    expect(rendered).toContain('Extreme Programming Explained');
  });

  test('keeps YAML front matter citation metadata when Marp comment directives follow', () => {
    fixture = createCitationFixture();
    const markdown = [
      '---',
      'bibliography: ../ref.bib',
      'csl: ../apa.csl',
      '---',
      '',
      '<!--',
      'theme: gaia',
      'paginate: true',
      'headingDivider: 2',
      'style: |',
      '  section {padding-top: 55px;}',
      '-->',
      '',
      'Kent Beck wrote about XP [@beck2000].',
      '',
      '<!-- references -->',
    ].join('\n');

    const rendered = processCitations(markdown, { basePath: fixture.deckDir });

    expect(rendered).toContain('(Beck, 2000)');
    expect(rendered).toContain('Extreme Programming Explained');
  });

  test('ignores invalid YAML in non-citation front matter fields', () => {
    fixture = createCitationFixture();
    const markdown = [
      '---',
      'title: Test: subtitle',
      'bibliography: ../ref.bib',
      'csl: ../apa.csl',
      '---',
      '',
      'Kent Beck wrote about XP [@beck2000].',
      '',
      '<!-- references -->',
    ].join('\n');

    const rendered = processCitations(markdown, { basePath: fixture.deckDir });

    expect(rendered).toContain('(Beck, 2000)');
    expect(rendered).toContain('Extreme Programming Explained');
  });

  test('styles second-field bibliography output on one line', () => {
    fixture = createCitationFixture();
    const marp = createMarp();
    const markdown = [
      '---',
      'bibliography: ../ref.bib',
      'csl: ../ieee.csl',
      '---',
      '',
      'Kent Beck wrote about XP [@beck2000].',
      '',
      '# References',
      '',
      '<!-- references -->',
    ].join('\n');

    const { css, html } = marp.render(markdown, {
      citationBasePath: fixture.deckDir,
    });

    expect(html).toContain('class="csl-left-margin">[1]</div>');
    expect(html).toContain('class="csl-right-inline"');
    expect(css).toContain('section .csl-left-margin');
    expect(css).toContain('display: table-cell');
    expect(css).toContain('section .csl-right-inline');
  });

  test('renders CSL styles that request the bundled Japanese locale', () => {
    fixture = createCitationFixture();
    const markdown = [
      '---',
      'bibliography: ../ref.bib',
      'csl: ../ja.csl',
      '---',
      '',
      'Kent Beck wrote about XP [@beck2000].',
      '',
      '# References',
      '',
      '<!-- references -->',
    ].join('\n');

    const rendered = processCitations(markdown, { basePath: fixture.deckDir });

    expect(rendered).toContain('Kent Beck');
    expect(rendered).toContain('Extreme Programming Explained');
    expect(rendered).toContain('参照');
  });

  test('renders split references with explicit ranges', () => {
    fixture = createCitationFixture();
    const markdown = [
      '---',
      'bibliography: ../ref.bib',
      'csl: ../apa.csl',
      '---',
      '',
      'Kent Beck wrote about XP [@beck2000; @fowler2018].',
      '',
      '# References 1',
      '',
      '<!-- references: 1-1 -->',
      '',
      '---',
      '',
      '# References 2',
      '',
      '<!-- references: 2- -->',
    ].join('\n');

    const rendered = processCitations(markdown, { basePath: fixture.deckDir });
    const firstReferences = rendered.slice(
      rendered.indexOf('# References 1'),
      rendered.indexOf('---', rendered.indexOf('# References 1')),
    );
    const secondReferences = rendered.slice(rendered.indexOf('# References 2'));

    expect(firstReferences).toContain('Beck');
    expect(firstReferences).not.toContain('Fowler');
    expect(secondReferences).toContain('Fowler');
    expect(secondReferences).not.toContain('Beck');
    expect(rendered).not.toContain('<!-- references:');
  });

  test('renders open-start references ranges', () => {
    fixture = createCitationFixture();
    const markdown = [
      '---',
      'bibliography: ../ref.bib',
      'csl: ../apa.csl',
      '---',
      '',
      'Kent Beck wrote about XP [@beck2000; @fowler2018].',
      '',
      '<!-- references: -1 -->',
    ].join('\n');

    const rendered = processCitations(markdown, { basePath: fixture.deckDir });

    expect(rendered).toContain('Beck');
    expect(rendered).not.toContain('<i>Refactoring</i>');
  });

  test('throws when a citation has no references marker', () => {
    fixture = createCitationFixture();
    const markdown = [
      '---',
      'bibliography: ../ref.bib',
      'csl: ../apa.csl',
      '---',
      '',
      'Kent Beck wrote about XP [@beck2000].',
    ].join('\n');

    expect(() =>
      processCitations(markdown, { basePath: fixture.deckDir }),
    ).toThrow("Citation references marker '<!-- references -->' is required.");
  });

  test('leaves a references marker alone when there are no citations', () => {
    const markdown = ['# References', '', '<!-- references -->'].join('\n');

    expect(processCitations(markdown)).toBe(markdown);
  });

  test('requires CSL metadata when rendering citations', () => {
    fixture = createCitationFixture();
    const markdown = [
      '---',
      'bibliography: ../ref.bib',
      '---',
      '',
      'Kent Beck wrote about XP [@beck2000].',
      '',
      '<!-- references -->',
    ].join('\n');

    expect(() =>
      processCitations(markdown, { basePath: fixture.deckDir }),
    ).toThrow("Citation metadata requires 'csl'.");
  });

  test('renders citation output through Marp and includes citation styles', () => {
    fixture = createCitationFixture();
    const marp = createMarp();
    const markdown = [
      '---',
      'bibliography: ../ref.bib',
      'csl: ../apa.csl',
      '---',
      '',
      '# XP',
      '',
      'Kent Beck wrote about XP [@beck2000].',
      '',
      '# References',
      '',
      '<!-- references -->',
    ].join('\n');

    const { css, html } = marp.render(markdown, {
      citationBasePath: fixture.deckDir,
    });

    expect(html).toContain('(Beck, 2000)');
    expect(html).toContain('class="csl-entry"');
    expect(html).toContain('Extreme Programming Explained');
    expect(css).toContain(CITATION_CSS);
  });
});
