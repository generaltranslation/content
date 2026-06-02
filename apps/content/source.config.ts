import {
  defineCollections,
  defineConfig,
  defineDocs,
  frontmatterSchema,
  metaSchema,
} from 'fumadocs-mdx/config';
import { z } from 'zod';

const contentFrontmatterSchema = frontmatterSchema.extend({
  authors: z.array(z.string()).optional(),
  date: z.any().optional(),
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

export default defineConfig({
  mdxOptions: {
    preset: 'minimal',
  },
});
