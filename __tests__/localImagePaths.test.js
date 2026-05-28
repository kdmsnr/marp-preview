const path = require('path');
const { pathToFileURL } = require('url');
const { createMarp } = require('../app/marp');
const {
  LOCAL_IMAGE_BASE_PATH,
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

  test('renders markdown images with file URLs', () => {
    const marp = createMarp();
    const basePath = '/tmp/decks/talk';
    const imageUrl = pathToFileURL(path.join(basePath, 'assets/photo.png')).href;
    const { html } = marp.render('![Photo](assets/photo.png)', {
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
