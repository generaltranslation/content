/**
 * validate-links.ts
 *
 * CI script that validates all internal links in MDX content files.
 * Parses MDX into an AST, extracts links and headings, then checks:
 *   1. Internal links (starting with /) resolve to actual files
 *   2. Anchor fragments (#heading) exist in the target file
 *   3. Same-page anchors (#heading) exist in the current file
 *   4. Template placeholder links expand correctly for all target libraries
 *
 * Locale prefixes are optional — middleware auto-fills them.
 * e.g. /docs/next/intro and /en-US/docs/next/intro are both valid.
 *
 * Usage: npx tsx validate-links.ts [--verbose]
 */

import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, relative, extname, dirname, basename } from "path";
import { fromMarkdown } from "mdast-util-from-markdown";
import { mdxFromMarkdown } from "mdast-util-mdx";
import { mdxjs } from "micromark-extension-mdxjs";
import { visit } from "unist-util-visit";
import GithubSlugger from "github-slugger";

// ─── Configuration ──────────────────────────────────────────────────────────

/** Root of the content repository (one level up from scripts/) */
const CONTENT_ROOT = join(import.meta.dirname, "..");

/** Directories containing MDX content to validate */
const CONTENT_DIRS = ["docs", "blog", "devlog"];

/** Template directory with placeholder files */
const TEMPLATE_DIR = "docs-templates";

/** Known locale codes that may appear as path prefixes */
const LOCALE_PATTERN = /^[a-z]{2}(-[A-Z]{2})?$/;

/**
 * Libraries that docs-templates/ generates into.
 * Each entry maps __DOCS_PATH__ and other placeholders.
 */
const TEMPLATE_TARGETS: Record<
  string,
  { DOCS_PATH: string; FRAMEWORK_NAME: string; PACKAGE_NAME: string }
> = {
  next: {
    DOCS_PATH: "/docs/next",
    FRAMEWORK_NAME: "Next.js",
    PACKAGE_NAME: "gt-next",
  },
  react: {
    DOCS_PATH: "/docs/react",
    FRAMEWORK_NAME: "React",
    PACKAGE_NAME: "gt-react",
  },
  "react-native": {
    DOCS_PATH: "/docs/react-native",
    FRAMEWORK_NAME: "React Native",
    PACKAGE_NAME: "gt-react-native",
  },
};

const VERBOSE = process.argv.includes("--verbose");

// ─── Types ──────────────────────────────────────────────────────────────────

interface FileInfo {
  /** Absolute path to the file */
  absPath: string;
  /** Path relative to content root */
  relPath: string;
  /** Set of heading slugs in this file (lowercased, github-style) */
  headings: Set<string>;
}

interface LinkError {
  /** File containing the broken link */
  file: string;
  /** Line number (1-indexed) */
  line: number;
  /** Column number (1-indexed) */
  column: number;
  /** The raw link text */
  link: string;
  /** Human-readable reason the link is broken */
  reason: string;
}

// ─── File Index ─────────────────────────────────────────────────────────────

/**
 * Maps a URL path (e.g. "/docs/next/introduction") to its FileInfo.
 * Built once at startup for fast lookups.
 */
const fileIndex = new Map<string, FileInfo>();

/**
 * Recursively find all .mdx files in a directory.
 */
function findMdxFiles(dir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMdxFiles(fullPath));
    } else if (extname(entry.name) === ".mdx") {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Convert a file path to the URL path it would be served at.
 *
 * docs/en-US/next/introduction.mdx → /docs/next/introduction
 * blog/en-US/my-post.mdx → /blog/my-post
 * devlog/en-US/v1.mdx → /devlog/v1
 *
 * The locale segment (e.g. en-US) is stripped since links don't require it.
 * Index files (index.mdx) map to the directory path.
 */
function filePathToUrlPath(relPath: string): string {
  // Remove .mdx extension
  let urlPath = relPath.replace(/\.mdx$/, "");

  // Split into segments
  const segments = urlPath.split("/");

  // Remove locale segment (second segment for docs/, first-level for blog/devlog)
  // Pattern: docs/en-US/... or blog/en-US/...
  if (segments.length >= 2 && LOCALE_PATTERN.test(segments[1])) {
    segments.splice(1, 1);
  }

  // Strip trailing /index for index files
  if (segments[segments.length - 1] === "index") {
    segments.pop();
  }

  return "/" + segments.join("/");
}

/**
 * Strip YAML frontmatter from MDX content.
 */
function stripFrontmatter(content: string): string {
  if (content.startsWith("---")) {
    const endIdx = content.indexOf("---", 3);
    if (endIdx !== -1) {
      // Preserve line count with empty lines so positions stay correct
      const frontmatter = content.slice(0, endIdx + 3);
      const lineCount = frontmatter.split("\n").length - 1;
      return "\n".repeat(lineCount) + content.slice(endIdx + 3);
    }
  }
  return content;
}

/**
 * Extract heading slugs from MDX content using GitHub-style slugging.
 * Supports custom heading IDs via [#id] syntax (e.g. ## My Heading [#custom-id]).
 */
function extractHeadings(content: string): Set<string> {
  const slugger = new GithubSlugger();
  const headings = new Set<string>();
  const stripped = stripFrontmatter(content);

  // Use regex to reliably extract headings, including custom [#id] syntax
  const headerRegex = /^#{1,6}\s+(.+)$/gm;
  let match;
  while ((match = headerRegex.exec(stripped)) !== null) {
    const headingText = match[1].trim();

    // Check for custom ID: ## Heading text [#custom-id]
    const customIdMatch = headingText.match(/\[#([^\]]+)\]\s*$/);
    if (customIdMatch) {
      headings.add(customIdMatch[1]);
      // Also add the github-slugged version of the full text (some links might use it)
      headings.add(slugger.slug(headingText.replace(/\s*\[#[^\]]+\]\s*$/, "")));
    } else {
      headings.add(slugger.slug(headingText));
    }
  }

  return headings;
}

/**
 * Recursively collect plain text from an AST node.
 */
function collectText(node: any): string {
  if (node.type === "text" || node.type === "inlineCode") {
    return node.value || "";
  }
  if (node.children) {
    return node.children.map(collectText).join("");
  }
  return "";
}

/**
 * Build the file index: scan all content directories and map URL paths to file info.
 */
function buildFileIndex(): void {
  for (const dir of CONTENT_DIRS) {
    const absDir = join(CONTENT_ROOT, dir);
    const files = findMdxFiles(absDir);

    for (const absPath of files) {
      const relPath = relative(CONTENT_ROOT, absPath);
      const urlPath = filePathToUrlPath(relPath);
      const content = readFileSync(absPath, "utf-8");
      const headings = extractHeadings(content);

      fileIndex.set(urlPath, { absPath, relPath, headings });

      if (VERBOSE) {
        console.log(`  indexed: ${urlPath} (${headings.size} headings)`);
      }
    }
  }
}

// ─── Link Extraction & Validation ───────────────────────────────────────────

/**
 * Extract all internal links from an MDX file.
 * Returns an array of { link, line, column } objects.
 */
function extractLinks(
  content: string,
  filePath: string
): Array<{ link: string; line: number; column: number }> {
  const links: Array<{ link: string; line: number; column: number }> = [];

  let tree;
  try {
    tree = fromMarkdown(content, {
      extensions: [mdxjs()],
      mdastExtensions: [mdxFromMarkdown()],
    });
  } catch {
    // Fall back to regex extraction if AST parsing fails
    if (VERBOSE) {
      console.warn(`  ⚠ AST parse failed for ${filePath}, using regex fallback`);
    }
    const linkRegex = /\]\(([^)]+)\)/g;
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      let match;
      while ((match = linkRegex.exec(lines[i])) !== null) {
        const href = match[1];
        if (href.startsWith("/") || href.startsWith("#")) {
          links.push({ link: href, line: i + 1, column: match.index + 1 });
        }
      }
    }
    return links;
  }

  // Walk AST for markdown links: [text](url)
  visit(tree, "link", (node: any) => {
    const href: string = node.url || "";
    if (href.startsWith("/") || href.startsWith("#")) {
      links.push({
        link: href,
        line: node.position?.start?.line ?? 0,
        column: node.position?.start?.column ?? 0,
      });
    }
  });

  // Also check for links in JSX href attributes (e.g. <a href="/..."> or <Card href="/...">)
  // We use regex on the raw content for this since mdast doesn't expose JSX attrs easily
  const jsxHrefRegex = /href=["']([^"']+)["']/g;
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    let match;
    while ((match = jsxHrefRegex.exec(lines[i])) !== null) {
      const href = match[1];
      if (href.startsWith("/") || href.startsWith("#")) {
        // Avoid duplicates with AST-extracted links on same line
        const alreadyFound = links.some(
          (l) => l.line === i + 1 && l.link === href
        );
        if (!alreadyFound) {
          links.push({ link: href, line: i + 1, column: match.index + 1 });
        }
      }
    }
  }

  return links;
}

/**
 * Strip an optional locale prefix from a URL path.
 * e.g. /en-US/docs/next/intro → /docs/next/intro
 */
function stripLocale(urlPath: string): string {
  const segments = urlPath.split("/").filter(Boolean);
  if (segments.length >= 1 && LOCALE_PATTERN.test(segments[0])) {
    return "/" + segments.slice(1).join("/");
  }
  return urlPath;
}

/**
 * Resolve a link to a file in the index.
 * Tries the path as-is, then with locale stripped.
 * Returns the FileInfo if found, or null.
 */
function resolveLink(urlPath: string): FileInfo | null {
  // Direct match
  if (fileIndex.has(urlPath)) return fileIndex.get(urlPath)!;

  // Try stripping locale prefix
  const stripped = stripLocale(urlPath);
  if (stripped !== urlPath && fileIndex.has(stripped))
    return fileIndex.get(stripped)!;

  return null;
}

/**
 * Validate all links in a single file.
 */
function validateFile(absPath: string, relPath: string): LinkError[] {
  const errors: LinkError[] = [];
  const content = readFileSync(absPath, "utf-8");
  const links = extractLinks(content, relPath);
  const currentFile = fileIndex.get(filePathToUrlPath(relPath));

  for (const { link, line, column } of links) {
    // Split into path and fragment
    const hashIdx = link.indexOf("#");
    const pathPart = hashIdx >= 0 ? link.slice(0, hashIdx) : link;
    const fragment = hashIdx >= 0 ? link.slice(hashIdx + 1) : null;

    // Same-page anchor (just #something)
    if (pathPart === "" && fragment !== null) {
      if (fragment === "") continue; // bare # is ok (top of page)
      if (currentFile && !currentFile.headings.has(fragment)) {
        errors.push({
          file: relPath,
          line,
          column,
          link,
          reason: `Anchor "#${fragment}" not found in this file. Available headings: ${
            currentFile.headings.size > 0
              ? [...currentFile.headings].join(", ")
              : "(none)"
          }`,
        });
      }
      continue;
    }

    // External links (shouldn't reach here, but guard)
    if (!pathPart.startsWith("/")) continue;

    // Resolve the path
    const target = resolveLink(pathPart);
    if (!target) {
      // Check if it's a known non-MDX route (e.g. /pricing, /dashboard)
      // We only validate links that point into our content dirs
      const topSegment = pathPart.split("/").filter(Boolean)[0];
      if (topSegment && CONTENT_DIRS.includes(topSegment)) {
        errors.push({
          file: relPath,
          line,
          column,
          link,
          reason: `Broken link: no file found for "${pathPart}". Check the path and ensure the target file exists.`,
        });
      }
      // Links outside content dirs (e.g. /pricing) are not validated
      continue;
    }

    // Validate fragment if present
    if (fragment && fragment !== "") {
      if (!target.headings.has(fragment)) {
        errors.push({
          file: relPath,
          line,
          column,
          link,
          reason: `Anchor "#${fragment}" not found in ${target.relPath}. Available headings: ${
            target.headings.size > 0
              ? [...target.headings].join(", ")
              : "(none)"
          }`,
        });
      }
    }
  }

  return errors;
}

// ─── Template Validation ────────────────────────────────────────────────────

/**
 * Validate links in docs-templates/ by expanding placeholders for each target library.
 */
function validateTemplates(): LinkError[] {
  const errors: LinkError[] = [];
  const templateDir = join(CONTENT_ROOT, TEMPLATE_DIR);
  if (!existsSync(templateDir)) return errors;

  const templateFiles = findMdxFiles(templateDir);

  for (const absPath of templateFiles) {
    const relPath = relative(CONTENT_ROOT, absPath);
    const content = readFileSync(absPath, "utf-8");

    // For each target library, expand placeholders and validate
    for (const [libName, vars] of Object.entries(TEMPLATE_TARGETS)) {
      const expanded = content
        .replace(/__DOCS_PATH__/g, vars.DOCS_PATH)
        .replace(/__FRAMEWORK_NAME__/g, vars.FRAMEWORK_NAME)
        .replace(/__PACKAGE_NAME__/g, vars.PACKAGE_NAME);

      const links = extractLinks(expanded, relPath);

      for (const { link, line, column } of links) {
        const hashIdx = link.indexOf("#");
        const pathPart = hashIdx >= 0 ? link.slice(0, hashIdx) : link;
        const fragment = hashIdx >= 0 ? link.slice(hashIdx + 1) : null;

        if (pathPart === "" && fragment !== null) {
          // Same-page anchor — check against the template's own headings (expanded)
          const templateHeadings = extractHeadings(expanded);
          if (fragment !== "" && !templateHeadings.has(fragment)) {
            // Also check the generated file as a fallback
            const templateRelFile = relative(CONTENT_ROOT, absPath).replace(
              TEMPLATE_DIR,
              `docs/en-US/${libName}`
            );
            const generatedUrl = filePathToUrlPath(templateRelFile);
            const generated = fileIndex.get(generatedUrl);
            if (!generated || !generated.headings.has(fragment)) {
              errors.push({
                file: `${relPath} (template → ${libName})`,
                line,
                column,
                link,
                reason: `Anchor "#${fragment}" not found when expanded for ${libName}.`,
              });
            }
          }
          continue;
        }

        if (!pathPart.startsWith("/")) continue;

        const target = resolveLink(pathPart);
        if (!target) {
          const topSegment = pathPart.split("/").filter(Boolean)[0];
          if (topSegment && CONTENT_DIRS.includes(topSegment)) {
            errors.push({
              file: `${relPath} (template → ${libName})`,
              line,
              column,
              link,
              reason: `Broken link: no file found for "${pathPart}" when expanded for ${libName}.`,
            });
          }
          continue;
        }

        if (fragment && fragment !== "" && !target.headings.has(fragment)) {
          errors.push({
            file: `${relPath} (template → ${libName})`,
            line,
            column,
            link,
            reason: `Anchor "#${fragment}" not found in ${target.relPath} when expanded for ${libName}.`,
          });
        }
      }
    }
  }

  return errors;
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main(): void {
  console.log("🔗 Link Validator — Scanning content files...\n");

  // Step 1: Build file index
  console.log("📁 Building file index...");
  buildFileIndex();
  console.log(`   Found ${fileIndex.size} content files.\n`);

  // Step 2: Validate all content files
  console.log("🔍 Validating links in content files...");
  const allErrors: LinkError[] = [];

  for (const [urlPath, info] of fileIndex) {
    const fileErrors = validateFile(info.absPath, info.relPath);
    allErrors.push(...fileErrors);
  }

  // Step 3: Validate templates
  console.log("📝 Validating links in templates...");
  const templateErrors = validateTemplates();
  allErrors.push(...templateErrors);

  // Step 4: Report
  console.log("");
  if (allErrors.length === 0) {
    console.log("✅ All links are valid!\n");
    process.exit(0);
  } else {
    console.log(
      `❌ Found ${allErrors.length} broken link${allErrors.length === 1 ? "" : "s"}:\n`
    );

    // Group errors by file for readability
    const byFile = new Map<string, LinkError[]>();
    for (const err of allErrors) {
      const existing = byFile.get(err.file) || [];
      existing.push(err);
      byFile.set(err.file, existing);
    }

    for (const [file, errors] of byFile) {
      console.log(`  📄 ${file}`);
      for (const err of errors) {
        console.log(`     Line ${err.line}: ${err.link}`);
        console.log(`     └─ ${err.reason}`);
      }
      console.log("");
    }

    process.exit(1);
  }
}

main();
