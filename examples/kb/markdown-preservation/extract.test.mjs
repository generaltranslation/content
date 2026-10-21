import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { compile } from '@mdx-js/mdx';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import { visit } from 'unist-util-visit';
import { parse as parseYaml } from 'yaml';

const cwd = fileURLToPath(new URL('.', import.meta.url));
const source = readFileSync(new URL('guide.mdx', import.meta.url), 'utf8');
const result = spawnSync(process.execPath, ['extract.mjs', 'guide.mdx'], {
  cwd,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const separator = result.stdout.indexOf('\n\n---\n');
assert.notEqual(separator, -1, 'demonstration prints segments followed by an MDX file');
const output = result.stdout.slice(separator + 2);
const parser = unified().use(remarkParse).use(remarkFrontmatter, ['yaml'])
  .use(remarkGfm).use(remarkMdx).use(remarkDirective);

function protectedContent(markdown) {
  const values = [];
  visit(parser.parse(markdown), (node) => {
    if (['yaml', 'code', 'inlineCode', 'mdxjsEsm', 'mdxTextExpression', 'mdxFlowExpression'].includes(node.type)) {
      values.push([node.type, node.lang, node.value]);
    }
    if (['link', 'image'].includes(node.type)) values.push([node.type, node.url, node.title, node.alt]);
    if (node.type.startsWith('mdxJsx')) {
      values.push([node.type, node.name, node.attributes.map(({ type, name, value }) => [type, name, value])]);
    }
    if (node.type.endsWith('Directive')) values.push([node.type, node.name, node.attributes]);
  });
  return values;
}

test('text replacement preserves code, URLs, metadata, JSX names/attributes, and directive names', () => {
  assert.deepEqual(protectedContent(output), protectedContent(source));
  assert.match(output, /INSTALL THE CLI/);
  assert.match(output, /READ THE GUIDE\./);
});

test('both documents compile as MDX and retain valid YAML', async () => {
  for (const document of [source, output]) {
    await compile(document, { remarkPlugins: [remarkFrontmatter, remarkGfm] });
    const frontmatter = document.match(/^---\n([\s\S]*?)\n---/)[1];
    assert.deepEqual(parseYaml(frontmatter), { title: 'Install the CLI', slug: '/install' });
  }
});

test('demonstrates why text-node extraction is incomplete', () => {
  assert.match(result.stdout, /"Run "\n", then read the "/);
  assert.match(output, /!\[Setup diagram\]/);
  assert.match(output, /title="Start here"/);
  assert.match(output, /title: Install the CLI/);
});

test('the article code is the code exercised by these fixtures', () => {
  const article = readFileSync(new URL('../../../kb/en-US/translate-markdown-files.mdx', import.meta.url), 'utf8');
  const inline = article.match(/```js\n(\/\/ extract\.mjs:[\s\S]*?)\n```/)[1];
  assert.equal(readFileSync(new URL('extract.mjs', import.meta.url), 'utf8').trim(), inline.trim());
});
