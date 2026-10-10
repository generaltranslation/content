import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Layout of docs/en-US/platform/openapi, written by gt-cloud's OpenAPI sync:
 * - `openapi.json`: the latest version's doc (gt-cloud `openapi.public.json`);
 * - `openapi.versions.json`: gt-cloud's version manifest, copied unchanged;
 * - `openapi.public.<version>.json`: each older doc, under its gt-cloud name.
 */
export const LATEST_OPENAPI_FILE = 'openapi.json';
export const OPENAPI_MANIFEST_FILE = 'openapi.versions.json';
export const LATEST_DOCUMENT_ID = 'gt-api';

const VERSION_PATTERN = /^\d{4}-\d{2}-\d{2}\.v\d+$/;
// Kept within the sync step's `openapi.public.*.json` cleanup glob, plus the
// latest doc's `openapi.public.json`.
const MANIFEST_FILE_PATTERN =
  /^openapi\.public(?:\.\d{4}-\d{2}-\d{2}\.v\d+)?\.json$/;

/**
 * @typedef {object} OpenApiDocument
 * @property {string} id `gt-api` for the latest version, `gt-api@<version>` otherwise.
 * @property {string} version
 * @property {boolean} latest
 * @property {string} path Path of the doc in `openApiDir` that documents this version.
 */

/**
 * Reads the version manifest in `openApiDir` and returns one document per API
 * version, oldest to newest. Throws when the manifest is missing or malformed.
 *
 * The latest entry's file is stored as `openapi.json`, so every entry naming
 * that file resolves there; other entries resolve to their file name.
 *
 * @param {string} openApiDir
 * @returns {OpenApiDocument[]}
 */
export function readOpenApiDocuments(openApiDir) {
  const manifestPath = path.join(openApiDir, OPENAPI_MANIFEST_FILE);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  if (!Array.isArray(manifest) || manifest.length === 0) {
    throw new Error(`${OPENAPI_MANIFEST_FILE} must be a non-empty array.`);
  }

  const versions = new Set();
  manifest.forEach((entry, index) => {
    if (
      !entry ||
      typeof entry !== 'object' ||
      typeof entry.version !== 'string' ||
      !VERSION_PATTERN.test(entry.version) ||
      typeof entry.file !== 'string' ||
      !MANIFEST_FILE_PATTERN.test(entry.file)
    ) {
      throw new Error(
        `${OPENAPI_MANIFEST_FILE} entry ${index} must have a version and an openapi.public file name.`
      );
    }
    if (versions.has(entry.version)) {
      throw new Error(
        `${OPENAPI_MANIFEST_FILE} lists version "${entry.version}" twice.`
      );
    }
    versions.add(entry.version);

    const isLast = index === manifest.length - 1;
    if (isLast ? entry.latest !== true : entry.latest !== undefined) {
      throw new Error(
        `${OPENAPI_MANIFEST_FILE} must mark only its last entry with "latest": true.`
      );
    }
  });

  const latestFile = manifest.at(-1).file;
  return manifest.map((entry) => ({
    id:
      entry.latest === true
        ? LATEST_DOCUMENT_ID
        : `${LATEST_DOCUMENT_ID}@${entry.version}`,
    version: entry.version,
    latest: entry.latest === true,
    path: path.join(
      openApiDir,
      entry.file === latestFile ? LATEST_OPENAPI_FILE : entry.file
    ),
  }));
}
