import assert from 'node:assert/strict';
import test from 'node:test';
import { bestMatch } from './locale-matching.mjs';

const cases = [
  [['zh-HK'], 'zh-Hant'],
  [['zh-SG'], 'zh-Hans'],
  [['pt'], 'pt-BR'],
  [['pt-AO'], 'pt-PT'],
  [['pt-MZ'], 'pt-PT'],
  [['fr-CA', 'pt-PT'], 'pt-PT'],
  [['fr-CA'], 'en'],
  [[], 'en'],
];

for (const [requested, expected] of cases) {
  test(`${JSON.stringify(requested)} -> ${expected}`, () => {
    assert.equal(bestMatch(requested), expected);
  });
}

test('invalid tags must be filtered before matching HTTP language ranges', () => {
  assert.throws(() => bestMatch(['*']), RangeError);
  assert.throws(() => bestMatch(['en_US']), RangeError);
});
