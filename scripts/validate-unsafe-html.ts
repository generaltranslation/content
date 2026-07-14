/**
 * Validate that MDX files do not render unsafe HTML elements.
 *
 * The validator parses MDX instead of scanning its source text so literal
 * examples inside fenced and inline code remain valid documentation.
 *
 * Usage: npx tsx validate-unsafe-html.ts
 */

import { existsSync, readFileSync, readdirSync } from "fs";
import { relative, resolve, join } from "path";
import { fileURLToPath } from "url";
import { fromMarkdown } from "mdast-util-from-markdown";
import { mdxFromMarkdown } from "mdast-util-mdx";
import { mdxjs } from "micromark-extension-mdxjs";
import { visit } from "unist-util-visit";

const CONTENT_ROOT = resolve(import.meta.dirname, "..");
const CONTENT_DIRS = ["docs", "docs-templates", "blog", "devlog"];
const UNSAFE_TAGS = new Set(["script", "iframe", "object", "embed", "style"]);
const UNSAFE_HTML_PATTERN =
  /<\s*(script|iframe|object|embed|style)(?=[\s/>])/gi;

interface AstNode {
  type: string;
  name?: string | null;
  value?: string;
  position?: {
    start: {
      line: number;
      column: number;
    };
  };
}

export interface UnsafeHtmlFinding {
  tag: string;
  line: number;
  column: number;
}

function stripFrontmatter(source: string): string {
  if (!source.startsWith("---")) return source;

  const endIndex = source.indexOf("---", 3);
  if (endIndex === -1) return source;

  const frontmatter = source.slice(0, endIndex + 3);
  const lineCount = frontmatter.split("\n").length - 1;
  return "\n".repeat(lineCount) + source.slice(endIndex + 3);
}

/**
 * Find unsafe elements that MDX parses as markup.
 *
 * Code and inlineCode nodes are never inspected because their contents render
 * as text. JSX and raw HTML nodes are inspected because they can render into
 * the resulting page.
 */
export function findUnsafeHtml(source: string): UnsafeHtmlFinding[] {
  const tree = fromMarkdown(stripFrontmatter(source), {
    extensions: [mdxjs()],
    mdastExtensions: [mdxFromMarkdown()],
  });
  const findings: UnsafeHtmlFinding[] = [];

  visit(tree, (node) => {
    const candidate = node as AstNode;

    if (
      (candidate.type === "mdxJsxFlowElement" ||
        candidate.type === "mdxJsxTextElement") &&
      candidate.name &&
      UNSAFE_TAGS.has(candidate.name.toLowerCase())
    ) {
      findings.push({
        tag: candidate.name.toLowerCase(),
        line: candidate.position?.start.line ?? 1,
        column: candidate.position?.start.column ?? 1,
      });
      return;
    }

    // MDX normally represents HTML-like markup as JSX nodes. Keep this check
    // for parser configurations that preserve raw HTML nodes.
    if (candidate.type === "html" && candidate.value) {
      for (const match of candidate.value.matchAll(UNSAFE_HTML_PATTERN)) {
        const beforeMatch = candidate.value.slice(0, match.index);
        const lines = beforeMatch.split("\n");
        findings.push({
          tag: match[1].toLowerCase(),
          line: (candidate.position?.start.line ?? 1) + lines.length - 1,
          column:
            lines.length === 1
              ? (candidate.position?.start.column ?? 1) +
                lines[lines.length - 1].length
              : lines[lines.length - 1].length + 1,
        });
      }
    }
  });

  return findings;
}

function findMdxFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];

  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...findMdxFiles(path));
    } else if (entry.isFile() && entry.name.endsWith(".mdx")) {
      files.push(path);
    }
  }
  return files;
}

function main(): void {
  const files = CONTENT_DIRS.flatMap((directory) =>
    findMdxFiles(join(CONTENT_ROOT, directory))
  );
  let findingCount = 0;
  let parseErrorCount = 0;

  for (const file of files) {
    const relativePath = relative(CONTENT_ROOT, file);

    try {
      const findings = findUnsafeHtml(readFileSync(file, "utf8"));
      for (const finding of findings) {
        findingCount++;
        console.error(
          `::error file=${relativePath},line=${finding.line},col=${finding.column}::` +
            `MDX files must not render <${finding.tag}> elements.`
        );
      }
    } catch (error) {
      parseErrorCount++;
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `::error file=${relativePath}::Unable to parse MDX while checking unsafe HTML: ${message}`
      );
    }
  }

  if (findingCount > 0 || parseErrorCount > 0) {
    console.error(
      `\nUnsafe HTML validation failed with ${findingCount} unsafe element(s)` +
        ` and ${parseErrorCount} parse error(s).`
    );
    process.exit(1);
  }

  console.log(`Validated ${files.length} MDX files for unsafe HTML.`);
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  main();
}
