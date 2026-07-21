/**
 * Validate that Callout components use a type supported by Fumadocs UI.
 *
 * The validator parses MDX instead of scanning its source text so literal
 * examples inside fenced and inline code remain valid documentation.
 *
 * Usage: npx tsx validate-callouts.ts
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

// Keep this list aligned with CalloutType in the pinned fumadocs-ui package.
// Reference: https://www.fumadocs.dev/docs/markdown#callouts
export const SUPPORTED_CALLOUT_TYPES = [
  "info",
  "warn",
  "warning",
  "error",
  "success",
] as const;

const SUPPORTED_CALLOUT_TYPE_SET = new Set<string>(SUPPORTED_CALLOUT_TYPES);

interface Position {
  start: {
    line: number;
    column: number;
  };
}

interface AstAttribute {
  type: string;
  name?: string;
  value?: string | object | null;
  position?: Position;
}

interface AstNode {
  type: string;
  name?: string | null;
  attributes?: AstAttribute[];
  position?: Position;
}

export interface UnsupportedCalloutTypeFinding {
  type: string;
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
 * Find Callout components whose type is unsupported or cannot be verified.
 *
 * Omitting type is valid because Fumadocs defaults to an info callout. Type
 * values must otherwise be string literals so this validator can verify them.
 */
export function findUnsupportedCalloutTypes(
  source: string
): UnsupportedCalloutTypeFinding[] {
  const tree = fromMarkdown(stripFrontmatter(source), {
    extensions: [mdxjs()],
    mdastExtensions: [mdxFromMarkdown()],
  });
  const findings: UnsupportedCalloutTypeFinding[] = [];

  visit(tree, (node) => {
    const candidate = node as AstNode;

    if (
      (candidate.type !== "mdxJsxFlowElement" &&
        candidate.type !== "mdxJsxTextElement") ||
      candidate.name !== "Callout"
    ) {
      return;
    }

    const typeAttribute = candidate.attributes?.find(
      (attribute) =>
        attribute.type === "mdxJsxAttribute" && attribute.name === "type"
    );

    if (!typeAttribute) return;

    const typeValue =
      typeof typeAttribute.value === "string"
        ? typeAttribute.value
        : typeAttribute.value === null || typeAttribute.value === undefined
          ? "true"
          : "expression";

    if (SUPPORTED_CALLOUT_TYPE_SET.has(typeValue)) return;

    findings.push({
      type: typeValue,
      line:
        typeAttribute.position?.start.line ??
        candidate.position?.start.line ??
        1,
      column:
        typeAttribute.position?.start.column ??
        candidate.position?.start.column ??
        1,
    });
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

function formatSupportedTypes(): string {
  const quotedTypes = SUPPORTED_CALLOUT_TYPES.map((type) => `"${type}"`);
  return `${quotedTypes.slice(0, -1).join(", ")}, or ${quotedTypes.at(-1)}`;
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
      const findings = findUnsupportedCalloutTypes(readFileSync(file, "utf8"));
      for (const finding of findings) {
        findingCount++;
        const received =
          finding.type === "expression"
            ? "a non-literal expression"
            : `"${finding.type}"`;
        console.error(
          `::error file=${relativePath},line=${finding.line},col=${finding.column}::` +
            `<Callout> type must be ${formatSupportedTypes()}; received ${received}.`
        );
      }
    } catch (error) {
      parseErrorCount++;
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `::error file=${relativePath}::Unable to parse MDX while checking Callout types: ${message}`
      );
    }
  }

  if (findingCount > 0 || parseErrorCount > 0) {
    console.error(
      `\nCallout validation failed with ${findingCount} unsupported type(s)` +
        ` and ${parseErrorCount} parse error(s).`
    );
    process.exit(1);
  }

  console.log(`Validated ${files.length} MDX files for Callout types.`);
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  main();
}
