/**
 * Validate the knowledge base folder, kb/, whose articles generaltranslation.com
 * serves at /en-US/kb/<slug> (and as Markdown at /kb/<slug>.md).
 *
 * - kb/ holds only <slug>.mdx files, with no subfolders.
 * - Slugs use only letters, digits, `-`, and `_` (the site rejects anything
 *   else), and never a reserved slug.
 * - Frontmatter has title, summary, and date, and no unknown fields.
 * - Titles are unique and at most TITLE_MAX characters.
 * - A summary is at most SUMMARY_MAX_WORDS words, ends with a period, and has
 *   no backticks or Markdown links (it is reused as plain text).
 * - `authors` is optional (the site credits the team without it); every
 *   listed author has a file in authors/.
 * - `date` is a real YYYY-MM-DD date, not in the future.
 * - The body parses as MDX, has at least MIN_BODY_WORDS words of text or a
 *   code block, starts headings at ##, never skips a heading level, tags
 *   every code block with a language, and has no filler, hand-written
 *   next-steps sections, or placeholders.
 * - Every `redirectFrom` entry is a blog post slug claimed by one article
 *   only, and is not the slug of a live blog or devlog post (a redirect would
 *   hide it).
 * - `related` lists at most RELATED_MAX other kb/ article slugs, each once.
 *
 * Usage: npx tsx validate-kb.ts
 */

import { existsSync, readFileSync, readdirSync } from "fs";
import { join, resolve } from "path";
import { fileURLToPath } from "url";

import { fromMarkdown } from "mdast-util-from-markdown";
import { mdxFromMarkdown } from "mdast-util-mdx";
import { mdxjs } from "micromark-extension-mdxjs";
import { visit } from "unist-util-visit";
import { parse } from "yaml";

const CONTENT_ROOT = resolve(import.meta.dirname, "..");
const KB_DIR = "kb";
const AUTHORS_DIR = "authors";
const LIVE_POST_DIRS = ["blog/en-US", "devlog/en-US"];

const SLUG = /^[A-Za-z0-9_-]+$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** /kb/sitemap.md is the Knowledge Base index, so no article may use it. */
export const RESERVED_SLUGS = ["sitemap"];

/** Most related questions the site shows for one article. */
export const RELATED_MAX = 5;

export const TITLE_MAX = 90;
export const SUMMARY_MAX_WORDS = 60;

/** Below this many words of text, an article without code reads as a placeholder. */
export const MIN_BODY_WORDS = 50;

const REQUIRED_FIELDS = ["title", "summary", "date"];

/** Every frontmatter field the site reads for a KB article. */
const KNOWN_FIELDS = new Set([
  ...REQUIRED_FIELDS,
  "authors",
  "redirectFrom",
  "related",
  "noindex",
]);

/** Phrases that stand in for the summary or pad the ending. */
const FILLER: { pattern: RegExp; problem: string }[] = [
  {
    pattern: /\bTL;DR\b/i,
    problem: 'contains "TL;DR"; the summary is the short answer.',
  },
  {
    pattern: /\bkey takeaways\b/i,
    problem: 'contains "Key takeaways"; the summary is the short answer.',
  },
  { pattern: /\bin conclusion\b/i, problem: 'contains "In conclusion".' },
  { pattern: /\bin today['’]s\b/i, problem: "contains \"In today's\"." },
];

/** Case-sensitive, so "todo app" in prose passes. */
const PLACEHOLDER_WORDS = /\b(TODO|TBD|FIXME)\b/;
const LOREM = /lorem ipsum/i;

/** Headings that duplicate the footer's related questions. */
const ROUNDUP_HEADING =
  /^(next steps|see also|learn more|further reading|related(\s.*)?)$/i;

export type KbEntry = {
  /** File or folder name directly inside kb/. */
  name: string;
  isDirectory: boolean;
  /** Parsed frontmatter; undefined when missing or not valid YAML. */
  frontmatter?: Record<string, unknown>;
  /** The MDX after the frontmatter. */
  body?: string;
  /** File line of the body's first line, so problems cite file lines. Defaults to 1. */
  bodyStartLine?: number;
};

export type KbContext = {
  /** Slugs of the published blog and devlog posts. */
  liveSlugs: readonly string[];
  /** Author slugs with a file in authors/. */
  authors: readonly string[];
  /** Today as YYYY-MM-DD. */
  today: string;
};

type MdastNode = {
  type: string;
  depth?: number;
  lang?: string | null;
  value?: string;
  children?: MdastNode[];
  position?: { start: { line: number } };
};

function isStringList(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((entry) => typeof entry === "string")
  );
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function nodeText(node: MdastNode): string {
  if (node.type === "text" || node.type === "inlineCode") {
    return node.value ?? "";
  }
  return (node.children ?? []).map(nodeText).join("");
}

function frontmatterProblems(
  path: string,
  frontmatter: Record<string, unknown>
): string[] {
  const problems = Object.keys(frontmatter)
    .filter((field) => !KNOWN_FIELDS.has(field))
    .map((field) => `${path}: unknown frontmatter field "${field}".`);
  for (const field of REQUIRED_FIELDS) {
    if (frontmatter[field] === undefined || frontmatter[field] === null) {
      problems.push(`${path}: frontmatter is missing ${field}.`);
    }
  }
  return problems;
}

function summaryProblems(path: string, summary: unknown): string[] {
  if (summary === undefined || summary === null) return [];
  if (typeof summary !== "string") return [`${path}: summary must be text.`];

  const problems: string[] = [];
  const words = countWords(summary);
  if (words > SUMMARY_MAX_WORDS) {
    problems.push(
      `${path}: summary is ${words} words; keep it to ${SUMMARY_MAX_WORDS} or fewer.`
    );
  }
  if (!summary.trim().endsWith(".")) {
    problems.push(`${path}: summary must end with a period.`);
  }
  if (summary.includes("`") || /\]\(/.test(summary)) {
    problems.push(
      `${path}: summary must not contain backticks or Markdown links.`
    );
  }
  return problems;
}

function authorProblems(
  path: string,
  authors: unknown,
  known: ReadonlySet<string>
): string[] {
  if (authors === undefined || authors === null) return [];
  if (!isStringList(authors)) {
    return [
      `${path}: authors must be a list of author slugs from ${AUTHORS_DIR}/.`,
    ];
  }
  return authors
    .filter((author) => !known.has(author))
    .map(
      (author) => `${path}: author "${author}" has no file in ${AUTHORS_DIR}/.`
    );
}

function dateProblems(path: string, date: unknown, today: string): string[] {
  if (date === undefined || date === null) return [];
  const real =
    typeof date === "string" &&
    ISO_DATE.test(date) &&
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
  if (!real) return [`${path}: date must be a real YYYY-MM-DD date.`];
  return date > today ? [`${path}: date ${date} is in the future.`] : [];
}

function headingProblems(
  path: string,
  heading: MdastNode,
  line: number,
  previousDepth: number
): string[] {
  const depth = heading.depth ?? 2;
  const problems: string[] = [];
  if (depth === 1) {
    problems.push(
      `${path}: line ${line} uses a level-1 heading; the title is the page heading, so start at ##.`
    );
  } else if (depth > previousDepth + 1) {
    problems.push(
      `${path}: line ${line} jumps from a level-${previousDepth} to a level-${depth} heading.`
    );
  }
  const text = nodeText(heading).trim();
  if (ROUNDUP_HEADING.test(text)) {
    problems.push(
      `${path}: line ${line} is a "${text}" section; the article footer adds related questions.`
    );
  }
  return problems;
}

function textProblems(path: string, text: string, line: number): string[] {
  const problems = FILLER.filter(({ pattern }) => pattern.test(text)).map(
    ({ problem }) => `${path}: line ${line} ${problem}`
  );
  const placeholder =
    text.match(PLACEHOLDER_WORDS)?.[0] ?? text.match(LOREM)?.[0];
  if (placeholder) {
    problems.push(
      `${path}: line ${line} contains the placeholder "${placeholder}".`
    );
  }
  return problems;
}

/**
 * Problems in an article body: unparseable MDX, too little text without
 * code, heading levels, untagged code blocks, filler, roundup sections, and
 * placeholders. Line numbers are file lines.
 */
function bodyProblems(path: string, body: string, startLine: number): string[] {
  let tree: ReturnType<typeof fromMarkdown>;
  try {
    tree = fromMarkdown(body, {
      extensions: [mdxjs()],
      mdastExtensions: [mdxFromMarkdown()],
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return [`${path}: the body is not valid MDX (${reason}).`];
  }

  const problems: string[] = [];
  const lineOf = (node: MdastNode) =>
    (node.position?.start.line ?? 1) + startLine - 1;
  let previousDepth = 1;
  let words = 0;
  let hasCode = false;

  visit(tree, (visited) => {
    const node = visited as MdastNode;
    if (node.type === "heading") {
      problems.push(
        ...headingProblems(path, node, lineOf(node), previousDepth)
      );
      previousDepth = node.depth ?? previousDepth;
    } else if (node.type === "code") {
      hasCode = true;
      if (!node.lang) {
        problems.push(
          `${path}: line ${lineOf(node)} starts a code block without a language tag.`
        );
      }
    } else if (node.type === "text" || node.type === "inlineCode") {
      words += countWords(node.value ?? "");
      if (node.type === "text") {
        problems.push(...textProblems(path, node.value ?? "", lineOf(node)));
      }
    }
  });

  if (words < MIN_BODY_WORDS && !hasCode) {
    problems.unshift(
      `${path}: the body has fewer than ${MIN_BODY_WORDS} words of text and no code; it reads as a placeholder.`
    );
  }
  return [...new Set(problems)];
}

function redirectProblems(
  path: string,
  redirectFrom: unknown,
  live: ReadonlySet<string>,
  claimedBy: Map<string, string>
): string[] {
  if (redirectFrom === undefined) return [];
  if (!isStringList(redirectFrom)) {
    return [`${path}: redirectFrom must be a list of blog post slugs.`];
  }

  const problems: string[] = [];
  for (const from of redirectFrom) {
    if (!SLUG.test(from)) {
      problems.push(`${path}: redirectFrom "${from}" is not a post slug.`);
    }
    if (live.has(from)) {
      problems.push(
        `${path}: redirectFrom "${from}" is a live post; the redirect would hide it.`
      );
    }
    const owner = claimedBy.get(from);
    if (owner) {
      problems.push(
        `${path}: redirectFrom "${from}" is already claimed by ${owner}.`
      );
    } else {
      claimedBy.set(from, path);
    }
  }
  return problems;
}

function relatedProblems(
  path: string,
  slug: string,
  related: unknown,
  kbSlugs: ReadonlySet<string>
): string[] {
  if (related === undefined) return [];
  if (!isStringList(related)) {
    return [`${path}: related must be a list of Knowledge Base article slugs.`];
  }

  const problems: string[] = [];
  if (related.length > RELATED_MAX) {
    problems.push(
      `${path}: related lists ${related.length} articles; the site shows at most ${RELATED_MAX}.`
    );
  }
  const seen = new Set<string>();
  for (const entry of related) {
    if (entry === slug) {
      problems.push(`${path}: related "${entry}" is the article itself.`);
    } else if (!kbSlugs.has(entry)) {
      problems.push(
        `${path}: related "${entry}" is not a Knowledge Base article.`
      );
    }
    if (seen.has(entry)) {
      problems.push(`${path}: related lists "${entry}" more than once.`);
    }
    seen.add(entry);
  }
  return problems;
}

function slugProblems(path: string, slug: string): string[] {
  const problems: string[] = [];
  if (!SLUG.test(slug)) {
    problems.push(
      `${path}: the slug may contain only letters, digits, "-", and "_".`
    );
  }
  if (RESERVED_SLUGS.includes(slug)) {
    problems.push(`${path}: "${slug}" is a reserved slug.`);
  }
  return problems;
}

/**
 * @param entries - Everything directly inside kb/
 * @param context - Live post slugs, author slugs, and today's date
 * @returns One message per problem; an empty array means kb/ is valid
 */
export function findKbProblems(
  entries: readonly KbEntry[],
  context: KbContext
): string[] {
  const problems: string[] = [];
  const live = new Set(context.liveSlugs);
  const authors = new Set(context.authors);
  const claimedBy = new Map<string, string>();
  const titleOwner = new Map<string, string>();
  const kbSlugs = new Set(
    entries
      .filter((entry) => !entry.isDirectory && entry.name.endsWith(".mdx"))
      .map((entry) => entry.name.slice(0, -".mdx".length))
  );

  for (const entry of entries) {
    const path = `${KB_DIR}/${entry.name}`;
    if (entry.isDirectory) {
      problems.push(`${path} is a folder; kb/ holds only <slug>.mdx files.`);
      continue;
    }
    if (!entry.name.endsWith(".mdx")) {
      problems.push(`${path} is not an .mdx file.`);
      continue;
    }

    const slug = entry.name.slice(0, -".mdx".length);
    problems.push(...slugProblems(path, slug));

    const frontmatter = entry.frontmatter;
    if (!frontmatter) {
      problems.push(`${path}: frontmatter is missing or is not valid YAML.`);
      continue;
    }
    problems.push(...frontmatterProblems(path, frontmatter));

    const { title } = frontmatter;
    if (typeof title === "string") {
      if (title.length > TITLE_MAX) {
        problems.push(
          `${path}: title is ${title.length} characters; keep it to ${TITLE_MAX} or fewer.`
        );
      }
      const key = title.trim().toLowerCase();
      const owner = titleOwner.get(key);
      if (owner) {
        problems.push(`${path}: title "${title}" duplicates ${owner}.`);
      } else {
        titleOwner.set(key, path);
      }
    }

    problems.push(
      ...summaryProblems(path, frontmatter.summary),
      ...authorProblems(path, frontmatter.authors, authors),
      ...dateProblems(path, frontmatter.date, context.today),
      ...bodyProblems(path, entry.body ?? "", entry.bodyStartLine ?? 1),
      ...redirectProblems(path, frontmatter.redirectFrom, live, claimedBy),
      ...relatedProblems(path, slug, frontmatter.related, kbSlugs)
    );
  }

  return problems;
}

/** Frontmatter, body, and the body's first file line of an .mdx file. */
function readArticle(
  path: string
): Pick<KbEntry, "frontmatter" | "body" | "bodyStartLine"> {
  const source = readFileSync(path, "utf8");
  const match = source.match(
    /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/
  );
  if (!match) return { body: source };

  let frontmatter: Record<string, unknown> | undefined;
  try {
    const data: unknown = parse(match[1]);
    frontmatter =
      data && typeof data === "object" && !Array.isArray(data)
        ? (data as Record<string, unknown>)
        : undefined;
  } catch {
    frontmatter = undefined;
  }
  return {
    frontmatter,
    body: source.slice(match[0].length),
    bodyStartLine: match[0].split("\n").length,
  };
}

function readSlugs(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((name) => name.endsWith(".mdx"))
    .map((name) => name.slice(0, -".mdx".length));
}

function main(): void {
  const kbPath = join(CONTENT_ROOT, KB_DIR);
  if (!existsSync(kbPath)) {
    console.log(`No ${KB_DIR}/ folder; nothing to validate.`);
    return;
  }

  const entries: KbEntry[] = readdirSync(kbPath, { withFileTypes: true }).map(
    (dirent) => ({
      name: dirent.name,
      isDirectory: dirent.isDirectory(),
      ...(dirent.isFile() && dirent.name.endsWith(".mdx")
        ? readArticle(join(kbPath, dirent.name))
        : {}),
    })
  );
  const problems = findKbProblems(entries, {
    liveSlugs: LIVE_POST_DIRS.flatMap((dir) =>
      readSlugs(join(CONTENT_ROOT, dir))
    ),
    authors: readSlugs(join(CONTENT_ROOT, AUTHORS_DIR)),
    today: new Date().toISOString().slice(0, 10),
  });

  for (const problem of problems) {
    console.error(`::error::${problem}`);
  }
  if (problems.length > 0) {
    console.error(
      `\nKnowledge base validation failed with ${problems.length} problem(s).`
    );
    process.exit(1);
  }

  console.log(`Validated ${KB_DIR}/: ${entries.length} articles.`);
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  main();
}
