import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');

const posts = [
  {
    slug: 'autism-intellectual-disability-and-transition-to-adulthood',
    title: 'Autism, Intellectual Disability, and the Transition to Adulthood',
  },
  {
    slug: 'why-the-end-of-school-services-feels-like-a-cliff',
    title: 'Why the End of School Services Can Feel Like Falling Off a Cliff',
  },
  {
    slug: 'preparing-for-adult-life-before-special-education-ends',
    title: 'Preparing for Adult Life Before Special Education Ends',
  },
];

for (const post of posts) {
  test(`${post.slug} is a complete published article`, () => {
    const articlePath = path.join(root, 'blog', `${post.slug}.html`);
    assert.ok(fs.existsSync(articlePath), `missing ${articlePath}`);
    const html = fs.readFileSync(articlePath, 'utf8');

    assert.match(html, new RegExp(`<h1>${post.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h1>`));
    assert.match(html, /<meta property="article:published_time" content="2026-09-18">/);
    assert.match(html, /<div data-blog-cta="top"><\/div>/);
    assert.match(html, /<div data-blog-cta="bottom"><\/div>/);
    assert.match(html, /<h2>What you can do this week<\/h2>/i);
    assert.match(html, /<h2>Long-term questions to consider<\/h2>/i);
    assert.match(html, /<h2>Sources and further reading<\/h2>/i);
    assert.match(html, /class="blog-keep-reading"/);
    assert.match(html, /<script src="\.\.\/js\/blog-ctas\.js"><\/script>/);
    assert.doesNotMatch(html, /Â|â€™|â€œ|â€/);

    const imageDir = path.join(root, 'assets', 'blog', 'september-18-2026', post.slug);
    for (const image of ['hero.jpg', 'hero.webp', 'social.jpg', 'social.webp']) {
      assert.ok(fs.existsSync(path.join(imageDir, image)), `missing ${post.slug}/${image}`);
    }
  });
}

test('blog index and sitemap expose all September 18 posts', () => {
  const index = fs.readFileSync(path.join(root, 'blog.html'), 'utf8');
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');

  for (const { slug } of posts) {
    assert.match(index, new RegExp(`blog/${slug}\\.html`));
    assert.match(sitemap, new RegExp(`https://casadesam\\.org/blog/${slug}\\.html`));
  }
});
