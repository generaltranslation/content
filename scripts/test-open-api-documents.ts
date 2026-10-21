import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { readOpenApiDocuments } from '../apps/content/src/lib/openApiDocuments.mjs';

let passed = 0;
let failed = 0;

function assertEqual<T>(actual: T, expected: T, message: string): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson === expectedJson) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.log(`  ❌ ${message}`);
    console.log(`     Expected: ${expectedJson}`);
    console.log(`     Actual:   ${actualJson}`);
  }
}

const openApiDir = mkdtempSync(join(tmpdir(), 'open-api-documents-'));

function readManifest(
  manifest: unknown
): ReturnType<typeof readOpenApiDocuments> {
  writeFileSync(
    join(openApiDir, 'openapi.versions.json'),
    JSON.stringify(manifest)
  );
  return readOpenApiDocuments(openApiDir);
}

function readError(manifest: unknown): string | undefined {
  try {
    readManifest(manifest);
    return undefined;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

console.log('\nOpenAPI version manifest reader\n');

try {
  assertEqual(
    readManifest([
      { version: '2025-01-01.v0', file: 'openapi.public.2025-01-01.v0.json' },
      { version: '2025-11-03.v1', file: 'openapi.public.2026-03-06.v1.json' },
      { version: '2026-03-06.v1', file: 'openapi.public.2026-03-06.v1.json' },
      { version: '2026-10-08.v1', file: 'openapi.public.json', latest: true },
    ]),
    [
      {
        id: 'gt-api@2025-01-01.v0',
        version: '2025-01-01.v0',
        latest: false,
        path: join(openApiDir, 'openapi.public.2025-01-01.v0.json'),
      },
      {
        id: 'gt-api@2025-11-03.v1',
        version: '2025-11-03.v1',
        latest: false,
        path: join(openApiDir, 'openapi.public.2026-03-06.v1.json'),
      },
      {
        id: 'gt-api@2026-03-06.v1',
        version: '2026-03-06.v1',
        latest: false,
        path: join(openApiDir, 'openapi.public.2026-03-06.v1.json'),
      },
      {
        id: 'gt-api',
        version: '2026-10-08.v1',
        latest: true,
        path: join(openApiDir, 'openapi.json'),
      },
    ],
    'maps each manifest entry to its document id and content file, oldest first'
  );

  assertEqual(
    readManifest([
      { version: '2026-03-06.v1', file: 'openapi.public.json' },
      { version: '2026-10-08.v1', file: 'openapi.public.json', latest: true },
    ]).map((document) => document.path),
    [join(openApiDir, 'openapi.json'), join(openApiDir, 'openapi.json')],
    'resolves an older version that shares the latest file to openapi.json'
  );

  rmSync(join(openApiDir, 'openapi.versions.json'));
  let missingError: string | undefined;
  try {
    readOpenApiDocuments(openApiDir);
  } catch (error) {
    missingError = error instanceof Error ? error.message : String(error);
  }
  assertEqual(
    missingError?.includes('ENOENT'),
    true,
    'rejects a missing manifest'
  );

  const latest = {
    version: '2026-10-08.v1',
    file: 'openapi.public.json',
    latest: true,
  };
  const rejected: ReadonlyArray<[string, unknown, string]> = [
    [
      'a manifest that is not an array',
      { latest },
      'must be a non-empty array',
    ],
    ['an empty manifest', [], 'must be a non-empty array'],
    [
      'an invalid version',
      [{ ...latest, version: 'latest' }],
      'entry 0 must have a version and an openapi.public file name',
    ],
    [
      'a file name outside the openapi.public layout',
      [{ version: '2025-01-01.v0', file: '../x.json' }, latest],
      'entry 0 must have a version and an openapi.public file name',
    ],
    [
      'a duplicate version',
      [{ version: '2026-10-08.v1', file: 'openapi.public.json' }, latest],
      'lists version "2026-10-08.v1" twice',
    ],
    [
      'latest on an entry before the last',
      [
        { ...latest, version: '2026-03-06.v1' },
        { version: '2026-10-08.v1', file: 'openapi.public.json' },
      ],
      'must mark only its last entry with "latest": true',
    ],
    [
      'a manifest without latest',
      [{ version: '2026-10-08.v1', file: 'openapi.public.json' }],
      'must mark only its last entry with "latest": true',
    ],
  ];
  for (const [name, manifest, message] of rejected) {
    assertEqual(
      readError(manifest)?.includes(message),
      true,
      `rejects ${name}`
    );
  }
} finally {
  rmSync(openApiDir, { recursive: true, force: true });
}

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) {
  throw new Error(`${failed} OpenAPI version manifest reader test(s) failed`);
}
