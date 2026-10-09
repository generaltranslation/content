/**
 * Validate the knowledge base folder, kb/, whose articles generaltranslation.com
 * serves at /en-US/kb/<slug> (and as Markdown at /kb/<slug>.md).
 *
 * - kb/ holds only <slug>.mdx files, with no subfolders.
 * - Slugs use only letters, digits, `-`, and `_` (the site rejects anything
 *   else), and never a reserved slug.
 * - Every `redirectFrom` entry is a blog post slug claimed by one article
 *   only, and is not the slug of a live blog or devlog post (a redirect would
 *   hide it).
 *
 * Usage: npx tsx validate-kb.ts
 */

import { existsSync, readFileSync, readdirSync } from "fs";
import { join, resolve } from "path";
import { fileURLToPath } from "url";

import { parse } from "yaml";

const CONTENT_ROOT = resolve(import.meta.dirname, "..");
const KB_DIR = "kb";
const LIVE_POST_DIRS = ["blog/en-US", "devlog/en-US"];

const SLUG = /^[A-Za-z0-9_-]+$/;

/** /kb/sitemap.md is the Knowledge Base index, so no article may use it. */
export const RESERVED_SLUGS = ["sitemap"];

export type KbEntry = {
  /** File or folder name directly inside kb/. */
  name: string;
  isDirectory: boolean;
  /** Parsed frontmatter `redirectFrom`, whatever shape it has. */
  redirectFrom?: unknown;
};

/**
 * @param entries - Everything directly inside kb/
 * @param liveSlugs - Slugs of the published blog and devlog posts
 * @returns One message per problem; an empty array means kb/ is valid
 */
export function findKbProblems(
  entries: readonly KbEntry[],
  liveSlugs: readonly string[]
): string[] {
  const problems: string[] = [];
  const live = new Set(liveSlugs);
  const claimedBy = new Map<string, string>();

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
    if (!SLUG.test(slug)) {
      problems.push(
        `${path}: the slug may contain only letters, digits, "-", and "_".`
      );
    }
    if (RESERVED_SLUGS.includes(slug)) {
      problems.push(`${path}: "${slug}" is a reserved slug.`);
    }

    if (entry.redirectFrom === undefined) continue;
    if (
      !Array.isArray(entry.redirectFrom) ||
      !entry.redirectFrom.every((from) => typeof from === "string")
    ) {
      problems.push(`${path}: redirectFrom must be a list of blog post slugs.`);
      continue;
    }
    for (const from of entry.redirectFrom) {
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
  }

  return problems;
}

function readFrontmatter(path: string): Record<string, unknown> {
  const match = readFileSync(path, "utf8").match(
    /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/
  );
  const data: unknown = match ? parse(match[1]) : null;
  return data && typeof data === "object" ? (data as Record<string, unknown>) : {};
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
      redirectFrom: dirent.name.endsWith(".mdx")
        ? readFrontmatter(join(kbPath, dirent.name)).redirectFrom
        : undefined,
    })
  );
  const liveSlugs = LIVE_POST_DIRS.flatMap((dir) =>
    readSlugs(join(CONTENT_ROOT, dir))
  );
  const problems = findKbProblems(entries, liveSlugs);

  for (const problem of problems) {
    console.error(`::error::${problem}`);
  }
  if (problems.length > 0) {
    console.error(`\nKnowledge base validation failed with ${problems.length} problem(s).`);
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
