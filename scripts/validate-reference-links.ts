/**
 * Validates that inline-code API symbols in prose link to their reference
 * pages. Fixes wrap the original source span without serializing the MDX AST.
 *
 * Usage: npx tsx validate-reference-links.ts [--fix]
 */

import {
  existsSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { mdxFromMarkdown } from 'mdast-util-mdx';
import { mdxjs } from 'micromark-extension-mdxjs';

const CONTENT_ROOT = resolve(import.meta.dirname, '..');
const CONTENT_DIRECTORIES = ['docs', 'blog', 'devlog'];
const REFERENCE_ROOT = join(CONTENT_ROOT, 'docs', 'en-US');

type AstPosition = {
  start: { line: number; column: number; offset?: number };
  end: { line: number; column: number; offset?: number };
};

type AstNode = {
  type: string;
  value?: string;
  children?: AstNode[];
  position?: AstPosition;
};

export type ReferenceSource = {
  path: string;
  source: string;
};

export type ReferenceTarget = {
  symbol: string;
  url: string;
  path: string;
};

export type ReferenceSymbolIndex = Map<string, ReferenceTarget[]>;

export type ReferenceLinkFinding = {
  symbol: string;
  line: number;
  column: number;
  startOffset: number;
  endOffset: number;
  target?: ReferenceTarget;
  candidates: ReferenceTarget[];
};

type NarrowExclusion = {
  path: string;
  symbol: string;
  line?: number;
  reason: string;
};

// Each entry suppresses one source symbol whose inline-code formatting is not
// an API reference. Scope by path and symbol when every occurrence on that page
// has the same non-API meaning; add a line only when API and non-API uses share
// a page.
const NARROW_EXCLUSIONS: NarrowExclusion[] = [
  {
    path: 'docs/en-US/react/reference/hooks/use-locale-selector.mdx',
    symbol: 'getLocaleProperties',
    reason:
      'This is a callback returned by useLocaleSelector, not the standalone utility.',
  },
  {
    path: 'devlog/en-US/generaltranslation_v7_8_0.mdx',
    symbol: 'formatListToParts()',
    reason: 'The release note refers to both the method and standalone function.',
  },
  {
    path: 'devlog/en-US/generaltranslation_v8_1_0.mdx',
    symbol: 'formatCutoff()',
    reason: 'The release note refers to both the method and standalone function.',
  },
  {
    path: 'devlog/en-US/gt-i18n_v0_9_0.mdx',
    symbol: 'getTranslations()',
    line: 10,
    reason: 'The gt-i18n export has no package-specific reference page.',
  },
];

function findMdxFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];

  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...findMdxFiles(path));
    } else if (entry.isFile() && extname(entry.name) === '.mdx') {
      files.push(path);
    }
  }
  return files;
}

function maskFrontmatter(source: string): string {
  if (!source.startsWith('---')) return source;

  const closingMatch = /^---[ \t]*$/gm;
  closingMatch.lastIndex = source.indexOf('\n') + 1;
  const closing = closingMatch.exec(source);
  if (!closing) return source;

  const endOffset = closing.index + closing[0].length;
  return (
    source
      .slice(0, endOffset)
      .replace(/[^\r\n]/g, ' ') + source.slice(endOffset)
  );
}

function readFrontmatterTitle(source: string): string | null {
  if (!source.startsWith('---')) return null;

  const closingMatch = /^---[ \t]*$/gm;
  closingMatch.lastIndex = source.indexOf('\n') + 1;
  const closing = closingMatch.exec(source);
  if (!closing) return null;

  const titleMatch = source.slice(0, closing.index).match(/^title:\s*(.+?)\s*$/m);
  if (!titleMatch) return null;

  const title = titleMatch[1].trim();
  if (
    (title.startsWith('"') && title.endsWith('"')) ||
    (title.startsWith("'") && title.endsWith("'"))
  ) {
    return title.slice(1, -1);
  }
  return title;
}

function pathToUrl(path: string): string {
  const segments = path
    .replace(/\\/g, '/')
    .replace(/\.mdx$/, '')
    .split('/')
    .filter(
      (segment) =>
        segment !== 'en-US' &&
        !(segment.startsWith('(') && segment.endsWith(')'))
    );

  if (segments.at(-1) === 'index') segments.pop();
  return `/${segments.join('/')}`;
}

function isDedicatedApiReference(path: string): boolean {
  const normalizedPath = path.replace(/\\/g, '/');
  return /\/reference\/(?:components|composables|hooks|functions|classes|types|commands|gt-class(?:-methods)?|utility-functions)(?:\/|$)/.test(
    normalizedPath
  );
}

function isApiTitle(title: string): boolean {
  const unquoted = title.replace(/^`|`$/g, '').trim();
  return (
    /^gt(?:\s+[\w-]+)+$/.test(unquoted) ||
    /^<\/?[$A-Za-z_][\w$.-]*\s*\/?>$/.test(unquoted) ||
    /^[$A-Za-z_][\w$]*(?:\.[$A-Za-z_][\w$]*)?(?:\(\))?$/.test(unquoted)
  );
}

function normalizeSymbol(symbol: string): string {
  let normalized = symbol.trim().replace(/\s+/g, ' ');
  normalized = normalized.replace(/^npx\s+/, '');

  const componentMatch = normalized.match(
    /^<\/?([$A-Za-z_][\w$.-]*)\s*\/?>$/
  );
  if (componentMatch) return componentMatch[1];

  if (/^gt\s+[\w-]+(?:\s|$)/.test(normalized)) {
    const parts = normalized.split(' ');
    return parts[1] === 'project' && parts[2]
      ? parts.slice(0, 3).join(' ')
      : parts.slice(0, 2).join(' ');
  }

  return normalized.replace(/\(\)$/, '');
}

function aliasesForTarget(target: ReferenceTarget): string[] {
  const title = target.symbol.replace(/^`|`$/g, '').trim();
  const aliases = [title];

  if (/^gt\s+/.test(title)) {
    const parts = title.split(' ');
    aliases.push(`npx ${title}`);
    if (parts.length === 2) aliases.push(parts[1]);
  } else if (/^[$A-Za-z_][\w$]*$/.test(title)) {
    aliases.push(`${title}()`);
  }

  if (target.path.includes('/reference/components/')) {
    aliases.push(`<${title}>`, `<${title} />`);
  }

  if (target.path.includes('/reference/gt-class-methods/')) {
    aliases.push(`gt.${title}`, `gt.${title}()`, `GT.${title}`, `GT.${title}()`);
  }

  return aliases;
}

function addTarget(
  index: ReferenceSymbolIndex,
  alias: string,
  target: ReferenceTarget
): void {
  const key = normalizeSymbol(alias);
  const targets = index.get(key) ?? [];
  if (!targets.some((candidate) => candidate.url === target.url)) {
    targets.push(target);
    index.set(key, targets);
  }
}

/**
 * Builds lookup aliases from dedicated API reference page titles, the two
 * React initialization sections documented on the shared config page, and
 * the grouped rrweb API sections.
 */
export function buildReferenceSymbolIndex(
  references: ReferenceSource[]
): ReferenceSymbolIndex {
  const index: ReferenceSymbolIndex = new Map();

  for (const reference of references) {
    const normalizedPath = reference.path.replace(/\\/g, '/');
    const title = readFrontmatterTitle(reference.source);

    if (
      title &&
      isDedicatedApiReference(normalizedPath) &&
      isApiTitle(title)
    ) {
      const target: ReferenceTarget = {
        symbol: title,
        url: pathToUrl(normalizedPath),
        path: normalizedPath,
      };
      for (const alias of aliasesForTarget(target)) {
        addTarget(index, alias, target);
      }
    }

    if (normalizedPath.endsWith('/react/reference/config.mdx')) {
      const initializeHeading =
        /^###\s+`(initializeGT(?:SPA)?)`\s+\[#([^\]]+)\]/gm;
      let match: RegExpExecArray | null;
      while ((match = initializeHeading.exec(reference.source)) !== null) {
        const target: ReferenceTarget = {
          symbol: match[1],
          url: `${pathToUrl(normalizedPath)}#${match[2]}`,
          path: normalizedPath,
        };
        for (const alias of aliasesForTarget(target)) {
          addTarget(index, alias, target);
        }
      }
    }

    if (normalizedPath.includes('/rrweb/reference/')) {
      const apiHeading = /^##\s+`([^`]+)`\s+\[#([^\]]+)\]/gm;
      let match: RegExpExecArray | null;
      while ((match = apiHeading.exec(reference.source)) !== null) {
        const target: ReferenceTarget = {
          symbol: match[1],
          url: `${pathToUrl(normalizedPath)}#${match[2]}`,
          path: normalizedPath,
        };
        for (const alias of aliasesForTarget(target)) {
          addTarget(index, alias, target);
        }
      }
    }
  }

  return index;
}

function targetContexts(target: ReferenceTarget): string[] {
  const path = target.path;
  if (path.includes('/react/(frameworks)/nextjs/')) {
    return ['react', 'nextjs', 'next.js', 'gt-next'];
  }
  if (path.includes('/react/(frameworks)/tanstack-start/')) {
    return ['react', 'tanstack-start', 'tanstack start', 'gt-tanstack-start'];
  }
  if (path.includes('/react/(frameworks)/react-native/')) {
    return ['react', 'react-native', 'react native', 'gt-react-native'];
  }
  if (path.includes('/react/')) {
    return ['react', 'gt-react'];
  }
  if (path.includes('/vue/')) return ['vue', 'gt-vue'];
  if (path.includes('/rrweb/')) return ['rrweb', 'gt-rrweb'];
  if (path.includes('/node/')) return ['node', 'gt-node'];
  if (path.includes('/python/')) {
    return [
      'python',
      'generaltranslation',
      'gt-i18n',
      'gt_i18n',
      'gt-flask',
      'gt_flask',
      'gt-fastapi',
      'gt_fastapi',
    ];
  }
  if (path.includes('/cli/')) return ['cli', 'gt command'];
  if (path.includes('/platform/core/')) return ['core', 'gt instance'];
  return [];
}

function sourceContexts(path: string): string[] {
  const normalizedPath = path.replace(/\\/g, '/');
  if (normalizedPath.includes('devlog/en-US/gt-next_')) {
    return ['react', 'nextjs'];
  }
  if (normalizedPath.includes('devlog/en-US/gt-react_')) return ['react'];
  if (normalizedPath.includes('devlog/en-US/gt-vue_')) return ['vue'];
  if (normalizedPath.includes('devlog/en-US/gt-rrweb_')) return ['rrweb'];
  if (normalizedPath.includes('devlog/en-US/gt-node_')) return ['node'];
  if (
    normalizedPath.includes('devlog/en-US/gt-cli_') ||
    normalizedPath.includes('devlog/en-US/gtx-cli_') ||
    normalizedPath.includes('devlog/en-US/gt_v')
  ) {
    return ['cli'];
  }
  if (
    normalizedPath.includes('/react/nextjs-') ||
    normalizedPath.includes('/react/nextjs_')
  ) {
    return ['react', 'nextjs'];
  }
  if (normalizedPath.includes('/react/tanstack-start-')) {
    return ['react', 'tanstack-start'];
  }
  if (normalizedPath.includes('/react/react-native-')) {
    return ['react', 'react-native'];
  }
  if (
    normalizedPath.includes('/cli/reference/formats/gt-jsx-files.mdx') ||
    normalizedPath.includes('/cli/guides/using-autoderive.mdx') ||
    normalizedPath.includes('/cli/guides/using-auto-jsx.mdx')
  ) {
    return ['cli', 'react'];
  }
  if (normalizedPath.includes('/react/(frameworks)/nextjs/')) {
    return ['react', 'nextjs'];
  }
  if (normalizedPath.includes('/react/(frameworks)/tanstack-start/')) {
    return ['react', 'tanstack-start'];
  }
  if (normalizedPath.includes('/react/(frameworks)/react-native/')) {
    return ['react', 'react-native'];
  }
  if (normalizedPath.includes('/react/')) return ['react'];
  if (normalizedPath.includes('/vue/')) return ['vue'];
  if (normalizedPath.includes('/rrweb/')) return ['rrweb'];
  if (normalizedPath.includes('/node/')) return ['node'];
  if (normalizedPath.includes('/python/')) return ['python'];
  if (normalizedPath.includes('/cli/')) return ['cli'];
  if (normalizedPath.includes('/platform/core/')) return ['core'];
  return [];
}

function targetIsApplicable(
  target: ReferenceTarget,
  sourcePath: string,
  context: string,
  symbol: string
): boolean {
  const path = target.path;
  const sourceTags = sourceContexts(sourcePath);
  const hasReactContext =
    /\b(?:react|gt-react|gt-next|gt-tanstack-start|gt-react-native|next\.js|jsx|tsx)\b/.test(
      context
    );
  const hasVueContext = /\b(?:vue|gt-vue)\b/.test(context);

  if (path.includes('/platform/core/')) return true;
  if (path.includes('/cli/reference/commands/')) {
    return (
      sourceTags.includes('cli') ||
      /^(?:npx\s+)?gt\s+/.test(symbol) ||
      /\b(?:cli|command|npx gt|gtx-cli)\b/.test(context)
    );
  }

  if (path.includes('/react/(frameworks)/nextjs/')) {
    return (
      sourceTags.includes('nextjs') ||
      context.includes('gt-next') ||
      context.includes('next.js')
    );
  }
  if (path.includes('/react/(frameworks)/tanstack-start/')) {
    return (
      sourceTags.includes('tanstack-start') ||
      context.includes('gt-tanstack-start') ||
      context.includes('tanstack start')
    );
  }
  if (path.includes('/react/(frameworks)/react-native/')) {
    return (
      sourceTags.includes('react-native') ||
      context.includes('gt-react-native') ||
      context.includes('react native')
    );
  }
  if (path.includes('/react/')) {
    if (sourceTags.includes('vue')) return false;
    if (hasVueContext && !hasReactContext) return false;
    if (sourceTags.includes('react') || sourceTags.includes('cli')) return true;
    if (
      !hasVueContext &&
      /^<\/?[$A-Z][\w$.-]*\s*\/?>$/.test(symbol)
    ) {
      return true;
    }
    return (
      context.includes('gt-react') ||
      context.includes('gt-next') ||
      context.includes('gt-tanstack-start') ||
      context.includes('gt-react-native') ||
      context.includes('react component') ||
      context.includes('jsx')
    );
  }

  if (path.includes('/vue/')) {
    if (sourceTags.includes('react')) return false;
    if (hasReactContext && !hasVueContext) return false;
    if (sourceTags.includes('vue')) return true;
    return hasVueContext;
  }

  if (path.includes('/node/')) {
    return sourceTags.includes('node') || context.includes('gt-node');
  }
  if (path.includes('/rrweb/')) {
    return sourceTags.includes('rrweb') || context.includes('gt-rrweb');
  }
  if (path.includes('/python/')) {
    return (
      sourceTags.includes('python') ||
      [
        'gt-flask',
        'gt_flask',
        'gt-fastapi',
        'gt_fastapi',
      ].some((packageName) => context.includes(packageName)) ||
      context.includes('python')
    );
  }

  return true;
}

function proseContext(source: string, offset: number): string {
  return source
    .slice(Math.max(0, offset - 1000), Math.min(source.length, offset + 1000))
    .replace(/\]\([^)]+\)/g, ']')
    .toLowerCase();
}

function localHeadingSymbols(source: string): Set<string> {
  const symbols = new Set<string>();
  const headingPattern = /^#{2,6}\s+`([^`]+)`\s+\[#[^\]]+\]/gm;
  let match: RegExpExecArray | null;
  while ((match = headingPattern.exec(maskFrontmatter(source))) !== null) {
    symbols.add(normalizeSymbol(match[1]));
  }
  return symbols;
}

function scoreTarget(
  target: ReferenceTarget,
  sourcePath: string,
  context: string
): number {
  const targetTags = targetContexts(target);
  const pathTags = sourceContexts(sourcePath);
  let score = 0;

  for (const pathTag of pathTags) {
    if (targetTags.includes(pathTag)) score += 100;
  }

  for (const targetTag of targetTags) {
    if (['react', 'vue', 'rrweb', 'node', 'python', 'cli', 'core'].includes(targetTag)) {
      continue;
    }
    if (context.includes(targetTag)) score += targetTag.includes('-') ? 40 : 20;
  }

  if (
    target.path.includes('/cli/reference/commands/') &&
    /\b(?:cli|command|npx gt|gtx-cli)\b/.test(context)
  ) {
    score += 40;
  }
  if (target.path.includes('/python/') && context.includes('python')) {
    score += 50;
  }
  if (target.path.includes('/rrweb/') && /\b(?:rrweb|gt-rrweb)\b/.test(context)) {
    score += 50;
  }
  if (target.path.includes('/react/') && /\b(?:react|jsx|tsx)\b/.test(context)) {
    score += 30;
  }
  if (target.path.includes('/vue/') && /\b(?:vue|gt-vue)\b/.test(context)) {
    score += 30;
  }

  if (target.path.includes('/reference/gt-class-methods/')) {
    if (
      context.includes('gt instance') ||
      context.includes('method') ||
      context.includes(`gt.${target.symbol.toLowerCase()}`)
    ) {
      score += 30;
    }
  }
  if (
    target.path.includes('/reference/utility-functions/')
  ) {
    score += 5;
    if (
      context.includes('utility') ||
      context.includes('standalone') ||
      context.includes('from `generaltranslation`') ||
      context.includes(`import { ${target.symbol.toLowerCase()}`)
    ) {
      score += 30;
    }
  }

  return score;
}

function resolveTarget(
  candidates: ReferenceTarget[],
  sourcePath: string,
  context: string
): ReferenceTarget | undefined {
  if (candidates.length === 1) return candidates[0];

  const scored = candidates.map((target) => ({
    target,
    score: scoreTarget(target, sourcePath, context),
  }));
  const highestScore = Math.max(...scored.map(({ score }) => score));
  const best = scored.filter(({ score }) => score === highestScore);
  return highestScore > 0 && best.length === 1 ? best[0].target : undefined;
}

function walkInlineCode(
  node: AstNode,
  ancestors: AstNode[],
  visitInlineCode: (node: AstNode, ancestors: AstNode[]) => void
): void {
  if (node.type === 'inlineCode') visitInlineCode(node, ancestors);
  for (const child of node.children ?? []) {
    walkInlineCode(child, [...ancestors, node], visitInlineCode);
  }
}

function isExcluded(
  finding: ReferenceLinkFinding,
  sourcePath: string
): boolean {
  return NARROW_EXCLUSIONS.some(
    (exclusion) =>
      exclusion.path === sourcePath &&
      normalizeSymbol(exclusion.symbol) === normalizeSymbol(finding.symbol) &&
      (exclusion.line === undefined || exclusion.line === finding.line)
  );
}

/**
 * Returns unlinked inline-code symbols from prose. Frontmatter, headings,
 * links, fenced code, self-references, and narrow non-API exclusions are
 * omitted.
 */
export function findUnlinkedReferenceSymbols(
  source: string,
  sourcePath: string,
  index: ReferenceSymbolIndex
): ReferenceLinkFinding[] {
  const tree = fromMarkdown(maskFrontmatter(source), {
    extensions: [mdxjs()],
    mdastExtensions: [mdxFromMarkdown()],
  }) as AstNode;
  const sourceUrl = pathToUrl(sourcePath);
  const selfHeadingSymbols = localHeadingSymbols(source);
  const findings: ReferenceLinkFinding[] = [];

  walkInlineCode(tree, [], (node, ancestors) => {
    if (
      ancestors.some(
        (ancestor) => ancestor.type === 'heading' || ancestor.type === 'link'
      )
    ) {
      return;
    }

    const symbol = node.value ?? '';
    const normalizedSymbol = normalizeSymbol(symbol);
    if (selfHeadingSymbols.has(normalizedSymbol)) return;

    const startOffset = node.position?.start.offset;
    const endOffset = node.position?.end.offset;
    if (startOffset === undefined || endOffset === undefined) return;

    const context = proseContext(source, startOffset);
    const candidates = (index.get(normalizedSymbol) ?? []).filter((target) =>
      targetIsApplicable(target, sourcePath, context, symbol)
    );
    if (candidates.length === 0) return;
    if (candidates.some((candidate) => candidate.url.split('#')[0] === sourceUrl)) {
      return;
    }

    const finding: ReferenceLinkFinding = {
      symbol,
      line: node.position?.start.line ?? 1,
      column: node.position?.start.column ?? 1,
      startOffset,
      endOffset,
      target: resolveTarget(candidates, sourcePath, context),
      candidates,
    };
    if (!isExcluded(finding, sourcePath)) findings.push(finding);
  });

  return findings;
}

/**
 * Wraps resolved source spans in Markdown links, applying edits from the end of
 * the file so every AST offset remains valid.
 */
export function applyReferenceLinkFixes(
  source: string,
  findings: ReferenceLinkFinding[]
): string {
  let fixed = source;
  const resolved = findings
    .filter(
      (finding): finding is ReferenceLinkFinding & { target: ReferenceTarget } =>
        finding.target !== undefined
    )
    .sort((left, right) => right.startOffset - left.startOffset);

  for (const finding of resolved) {
    const original = fixed.slice(finding.startOffset, finding.endOffset);
    fixed =
      fixed.slice(0, finding.startOffset) +
      `[${original}](${finding.target.url})` +
      fixed.slice(finding.endOffset);
  }
  return fixed;
}

function loadReferenceSources(): ReferenceSource[] {
  return findMdxFiles(REFERENCE_ROOT)
    .filter((path) => path.replace(/\\/g, '/').includes('/reference/'))
    .map((path) => ({
      path: relative(CONTENT_ROOT, path).replace(/\\/g, '/'),
      source: readFileSync(path, 'utf8'),
    }));
}

function reportFinding(path: string, finding: ReferenceLinkFinding): void {
  if (finding.target) {
    console.error(
      `::error file=${path},line=${finding.line},col=${finding.column}::` +
        `Inline-code API symbol \`${finding.symbol}\` must link to ${finding.target.url}.`
    );
    return;
  }

  const candidateUrls = finding.candidates
    .map((candidate) => candidate.url)
    .join(', ');
  console.error(
    `::error file=${path},line=${finding.line},col=${finding.column}::` +
      `Inline-code API symbol \`${finding.symbol}\` is ambiguous: ${candidateUrls}.`
  );
}

function main(): void {
  const shouldFix = process.argv.includes('--fix');
  const index = buildReferenceSymbolIndex(loadReferenceSources());
  const files = CONTENT_DIRECTORIES.flatMap((directory) =>
    findMdxFiles(join(CONTENT_ROOT, directory))
  );
  let fixedCount = 0;
  let parseErrorCount = 0;
  const remaining: Array<{ path: string; finding: ReferenceLinkFinding }> = [];

  for (const file of files) {
    const path = relative(CONTENT_ROOT, file).replace(/\\/g, '/');
    try {
      let source = readFileSync(file, 'utf8');
      const findings = findUnlinkedReferenceSymbols(source, path, index);
      if (shouldFix) {
        const resolvedCount = findings.filter((finding) => finding.target).length;
        if (resolvedCount > 0) {
          source = applyReferenceLinkFixes(source, findings);
          writeFileSync(file, source);
          fixedCount += resolvedCount;
        }
      }

      const postFixFindings = shouldFix
        ? findUnlinkedReferenceSymbols(source, path, index)
        : findings;
      for (const finding of postFixFindings) {
        remaining.push({ path, finding });
      }
    } catch (error) {
      parseErrorCount++;
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `::error file=${path}::Unable to parse MDX while checking reference links: ${message}`
      );
    }
  }

  for (const { path, finding } of remaining) reportFinding(path, finding);

  if (shouldFix) {
    console.log(`Added ${fixedCount} reference link${fixedCount === 1 ? '' : 's'}.`);
  }
  if (remaining.length > 0 || parseErrorCount > 0) {
    console.error(
      `Reference link validation failed with ${remaining.length} unlinked symbol(s)` +
        ` and ${parseErrorCount} parse error(s).`
    );
    process.exit(1);
  }

  console.log(
    `Validated ${files.length} MDX files against ${index.size} reference symbol aliases.`
  );
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  main();
}
