// extract.mjs: npm i unified remark-parse remark-stringify remark-mdx
//   remark-frontmatter remark-gfm remark-directive unist-util-visit
import { readFileSync } from 'node:fs';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkDirective from 'remark-directive';
import remarkStringify from 'remark-stringify';
import { visit } from 'unist-util-visit';

const processor = unified()
  .use(remarkParse)
  .use(remarkFrontmatter, ['yaml']) // frontmatter becomes one `yaml` node
  .use(remarkGfm)                   // tables
  .use(remarkMdx)                   // import/export and JSX
  .use(remarkDirective)             // :::tip admonitions
  .use(remarkStringify);

const tree = processor.parse(readFileSync(process.argv[2], 'utf8'));

// This demonstration extracts text nodes only. Display text in attributes
// and frontmatter needs separate handling in a production translator.
const segments = [];
visit(tree, 'text', (node) => {
  if (node.value.trim()) segments.push(node);
});

console.log(segments.map((n) => JSON.stringify(n.value)).join('\n'));

// Stand-in for a translation call: replace each segment in place.
for (const node of segments) node.value = node.value.toUpperCase();
console.log('\n' + processor.stringify(tree));
