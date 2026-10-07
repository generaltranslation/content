/**
 * Validate blog/order.json, the array of post slugs that sets the order of
 * the blog index on generaltranslation.com (the first three take the
 * feature slots).
 *
 * The list must name every post in blog/en-US exactly once and nothing
 * else, so a new post cannot land unplaced and a renamed post cannot leave
 * a stale entry behind.
 *
 * Usage: npx tsx validate-blog-order.ts
 */

import { existsSync, readFileSync, readdirSync } from "fs";
import { join, resolve } from "path";
import { fileURLToPath } from "url";

const CONTENT_ROOT = resolve(import.meta.dirname, "..");
const ORDER_FILE = "blog/order.json";
const POSTS_DIR = "blog/en-US";

/**
 * Compare a parsed order list against the slugs of the published posts.
 *
 * @param order - The parsed JSON of blog/order.json, whatever shape it has
 * @param slugs - The post slugs, one per `.mdx` file in blog/en-US
 * @returns One message per problem; an empty array means the list is valid
 */
export function findBlogOrderProblems(
  order: unknown,
  slugs: readonly string[]
): string[] {
  if (!Array.isArray(order)) {
    return [`${ORDER_FILE} must be a JSON array of post slugs.`];
  }

  const problems: string[] = [];
  const seen = new Set<string>();
  const posts = new Set(slugs);

  order.forEach((entry, index) => {
    if (typeof entry !== "string") {
      problems.push(
        `Entry ${index} is ${JSON.stringify(entry)}; every entry must be a post slug string.`
      );
      return;
    }
    if (seen.has(entry)) {
      problems.push(`"${entry}" is listed more than once.`);
    }
    seen.add(entry);
    if (!posts.has(entry)) {
      problems.push(`"${entry}" has no post at ${POSTS_DIR}/${entry}.mdx.`);
    }
  });

  for (const slug of slugs) {
    if (!seen.has(slug)) {
      problems.push(
        `${POSTS_DIR}/${slug}.mdx is not listed; add "${slug}" where it should appear.`
      );
    }
  }

  return problems;
}

function readPostSlugs(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((name) => name.endsWith(".mdx"))
    .map((name) => name.slice(0, -".mdx".length))
    .sort();
}

function main(): void {
  const orderPath = join(CONTENT_ROOT, ORDER_FILE);
  if (!existsSync(orderPath)) {
    console.error(`::error file=${ORDER_FILE}::${ORDER_FILE} is missing.`);
    process.exit(1);
  }

  let order: unknown;
  try {
    order = JSON.parse(readFileSync(orderPath, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `::error file=${ORDER_FILE}::${ORDER_FILE} is not valid JSON: ${message}`
    );
    process.exit(1);
  }

  const slugs = readPostSlugs(join(CONTENT_ROOT, POSTS_DIR));
  const problems = findBlogOrderProblems(order, slugs);

  for (const problem of problems) {
    console.error(`::error file=${ORDER_FILE}::${problem}`);
  }

  if (problems.length > 0) {
    console.error(
      `\nBlog order validation failed with ${problems.length} problem(s).`
    );
    process.exit(1);
  }

  console.log(
    `Validated ${ORDER_FILE}: ${slugs.length} posts listed exactly once.`
  );
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  main();
}
