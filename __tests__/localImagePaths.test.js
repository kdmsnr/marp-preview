const path = require('path');
const { pathToFileURL } = require('url');
const { createMarp } = require('../app/marp');
const {
  LOCAL_IMAGE_BASE_PATH,
  resolveHtmlImageUrls,
  resolveLocalImageUrl,
} = require('../app/localImagePaths');

describe('localImagePaths', () => {
  test('resolves relative image paths from the markdown file directory', () => {
    const resolved = resolveLocalImageUrl(
      './assets/photo.png',
      '/tmp/decks/talk',
    );

    expect(resolved).toBe(
      pathToFileURL('/tmp/decks/talk/assets/photo.png').href,
    );
  });

  test('leaves external and data URLs unchanged', () => {
    expect(resolveLocalImageUrl('https://example.com/a.png', '/tmp')).toBe(
      'https://example.com/a.png',
    );
    expect(resolveLocalImageUrl('data:image/png;base64,abc', '/tmp')).toBe(
      'data:image/png;base64,abc',
    );
  });

  test('resolves relative image paths in HTML img tags', () => {
    const basePath = '/tmp/decks/talk';
    const firstUrl = pathToFileURL(
      path.join(basePath, 'assets/first image.png'),
    ).href;
    const secondUrl = pathToFileURL(
      path.join(basePath, 'assets/second.png'),
    ).href;

    expect(
      resolveHtmlImageUrls(
        '<img alt="First" src="assets/first image.png"><IMG SRC=\'assets/second.png\'>',
        basePath,
      ),
    ).toBe(`<img alt="First" src="${firstUrl}"><IMG SRC='${secondUrl}'>`);
  });

  test('leaves external image paths in HTML unchanged', () => {
    const html =
      '<img src="https://example.com/a.png"><img src="data:image/png;base64,abc">';

    expect(resolveHtmlImageUrls(html, '/tmp/decks/talk')).toBe(html);
  });

  test('renders markdown images with file URLs', () => {
    const marp = createMarp();
    const basePath = '/tmp/decks/talk';
    const imageUrl = pathToFileURL(
      path.join(basePath, 'assets/photo.png'),
    ).href;
    const { html } = marp.render('![Photo](assets/photo.png)', {
      [LOCAL_IMAGE_BASE_PATH]: basePath,
    });

    expect(html).toContain(`src="${imageUrl}"`);
  });

  test('renders block HTML images with file URLs', () => {
    const marp = createMarp();
    const basePath = '/tmp/decks/talk';
    const imageUrl = pathToFileURL(
      path.join(basePath, 'assets/photo.png'),
    ).href;
    const { html } = marp.render('<img src="assets/photo.png">', {
      [LOCAL_IMAGE_BASE_PATH]: basePath,
    });

    expect(html).toContain(`src="${imageUrl}"`);
  });

  test('renders inline HTML images with file URLs', () => {
    const marp = createMarp();
    const basePath = '/tmp/decks/talk';
    const imageUrl = pathToFileURL(
      path.join(basePath, 'assets/photo.png'),
    ).href;
    const { html } = marp.render('Before <img src="assets/photo.png"> after', {
      [LOCAL_IMAGE_BASE_PATH]: basePath,
    });

    expect(html).toContain(`src="${imageUrl}"`);
  });

  test('renders Marp background images with file URLs', () => {
    const marp = createMarp();
    const basePath = '/tmp/decks/talk';
    const imageUrl = pathToFileURL(path.join(basePath, 'assets/bg.png')).href;
    const { html } = marp.render('![bg](assets/bg.png)', {
      [LOCAL_IMAGE_BASE_PATH]: basePath,
    });

    expect(html).toContain(`background-image:url(&quot;${imageUrl}&quot;)`);
  });
});
