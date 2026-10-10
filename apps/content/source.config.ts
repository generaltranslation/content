import {
  defineCollections,
  defineConfig,
  defineDocs,
  frontmatterSchema,
  metaSchema,
} from 'fumadocs-mdx/config';
import { remarkGfm, remarkHeading } from 'fumadocs-core/mdx-plugins';
import { z } from 'zod';

const contentFrontmatterSchema = frontmatterSchema.extend({
  authors: z.array(z.string()).optional(),
  date: z.any().optional(),
  headline: z.string().min(3).max(60).optional(),
  index: z.boolean().default(false),
  method: z.string().optional(),
  preview: z.string().optional(),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const contentMetaSchema = metaSchema.extend({
  description: z.string().optional(),
});

export const docs = defineDocs({
  dir: '../../docs',
  docs: {
    schema: contentFrontmatterSchema,
  },
  meta: {
    schema: contentMetaSchema,
    // Only meta.json files are navigation metadata; other JSON under docs/,
    // such as the OpenAPI snapshots, is not validated as metadata.
    files: ['**/meta.json'],
  },
});

export const blog = defineCollections({
  type: 'doc',
  dir: '../../blog',
  schema: contentFrontmatterSchema,
});

export const devlog = defineCollections({
  type: 'doc',
  dir: '../../devlog',
  schema: contentFrontmatterSchema,
});

// Knowledge base articles: flat kb/<slug>.mdx files, served only in en-US.
export const kb = defineCollections({
  type: 'doc',
  dir: '../../kb',
  schema: frontmatterSchema.extend({
    summary: z.string().min(1),
    date: z.union([z.date(), z.string().min(1)]),
    authors: z.array(z.string()).optional(),
    noindex: z.boolean().optional(),
    // Blog post slugs whose /blog/<slug> URLs redirect to this article.
    redirectFrom: z.array(z.string()).optional(),
  }),
});

export default defineConfig({
  mdxOptions: {
    preset: 'minimal',
    remarkPlugins: [remarkGfm, remarkHeading],
  },
});
