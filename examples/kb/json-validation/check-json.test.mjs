import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { validate } from './check-json.mjs';

const directory = fileURLToPath(new URL('.', import.meta.url));
const fixture = (name) => JSON.parse(readFileSync(new URL(`fixtures/${name}.json`, import.meta.url), 'utf8'));
const english = fixture('i18next-en');
const polish = fixture('i18next-pl');
const checkIcu = (source, target, locale = 'de') => validate({ message: source }, { message: target }, locale, 'icu');

test('correct Polish expansion passes, including new few and many keys', () => {
  assert.deepEqual(validate(english, polish, 'pl', 'i18next'), []);
});

test('missing Polish forms fail', () => {
  assert.deepEqual(validate(english, fixture('i18next-pl-missing'), 'pl', 'i18next'), [
    'missing key: /inbox_few', 'missing key: /inbox_many',
  ]);
});

test('Arabic may add all six forms; Japanese needs only other', () => {
  const source = { item_one: '{{count}} item', item_other: '{{count}} items' };
  const arabic = Object.fromEntries(['zero', 'one', 'two', 'few', 'many', 'other'].map((category) => [`item_${category}`, '{{count}} عنصر']));
  assert.deepEqual(validate(source, arabic, 'ar', 'i18next'), []);
  assert.deepEqual(validate(source, { item_other: '{{count}}個' }, 'ja', 'i18next'), []);
});

test('new target plural forms still have their placeholders checked', () => {
  assert.deepEqual(validate(english, { ...polish, inbox_few: 'Masz {{total}} nowe wiadomości' }, 'pl', 'i18next'), [
    'message contract differs: /inbox_few',
  ]);
});

test('nonplural extra and missing keys fail', () => {
  assert.deepEqual(validate({ home: 'Home' }, { renamed: 'Start' }, 'de', 'i18next'), [
    'missing key: /home', 'extra key: /renamed',
  ]);
});

test('literal dotted keys and nested paths cannot overwrite each other', () => {
  assert.deepEqual(validate({ 'nav.home': 'Home', nav: { home: 'Home' } }, { nav: { home: 'Start' } }, 'de', 'i18next'), [
    'missing key: /nav.home',
  ]);
});

test('optional i18next zero form is allowed', () => {
  assert.deepEqual(validate({ item_one: '{{count}} item', item_other: '{{count}} items' }, {
    item_one: '{{count}} Element', item_other: '{{count}} Elemente', item_zero: '{{count}} Elemente',
  }, 'de', 'i18next'), []);
});

test('missing braces, unbalanced tags, and changed numbered tags fail', () => {
  for (const changed of ['Hello, {{name}!', '<1>Hello</2>', '<2>Hello</2>']) {
    assert.notDeepEqual(validate({ text: '<1>Hello, {{name}}!</1>' }, { text: changed }, 'de', 'i18next'), []);
  }
});

test('unsupported interpolation formats and ordinal keys fail explicitly', () => {
  assert.match(validate({ text: '{{amount, number}}' }, { text: '{{amount, number}}' }, 'de', 'i18next')[0], /unsupported/);
  assert.throws(() => validate({ rank_ordinal_other: '{{count}}th' }, {}, 'de', 'i18next'), /ordinal/);
});

test('ICU fixtures accept translated text and reject a renamed controlling variable', () => {
  assert.deepEqual(validate(fixture('icu-en'), fixture('icu-de'), 'de', 'icu'), []);
  assert.deepEqual(validate(fixture('icu-en'), fixture('icu-de-renamed'), 'de', 'icu'), ['message contract differs: /inbox']);
});

test('ICU parser rejects malformed input and missing other branches', () => {
  assert.match(validate(fixture('icu-en'), fixture('icu-de-malformed'), 'de', 'icu')[0], /^target \/inbox:/);
  assert.match(checkIcu('{count, plural, other {# messages}}', '{count, plural, one {# Nachricht}}')[0], /^target/);
});

test('ICU nested controls, reordered arguments, and new plural categories pass', () => {
  assert.deepEqual(checkIcu(
    '{gender, select, female {{name}: {count, plural, one {# message} other {# messages}}} other {{name}: {count, plural, other {# messages}}}}',
    '{gender, select, female {{count, plural, one {# wiadomość} few {# wiadomości} many {# wiadomości} other {# wiadomości}}: {name}} other {{count, plural, other {# wiadomości}}: {name}}}',
    'pl',
  ), []);
});

test('ICU compares simple, number, date, time, and select argument names/types', () => {
  for (const [source, target] of [
    ['{name}', '{person}'], ['{amount, number}', '{amount}'],
    ['{day, date}', '{otherDay, date}'], ['{time, time}', '{time, date}'],
    ['{gender, select, female {She} other {They}}', '{sex, select, female {Sie} other {Sie}}'],
  ]) assert.deepEqual(checkIcu(source, target), ['message contract differs: /message']);
});

test('ICU preserves explicit selectors, select cases, and plural offsets', () => {
  for (const [source, target] of [
    ['{n, plural, =0 {None} other {#}}', '{n, plural, other {#}}'],
    ['{n, plural, offset:1 other {#}}', '{n, plural, other {#}}'],
    ['{g, select, female {She} other {They}}', '{g, select, other {Sie}}'],
  ]) assert.deepEqual(checkIcu(source, target), ['message contract differs: /message']);
});

test('ICU rich-text tags are parsed and compared', () => {
  assert.deepEqual(checkIcu('<b>{name}</b>', '<b>{name}</b>'), []);
  assert.deepEqual(checkIcu('<b>{name}</b>', '<i>{name}</i>'), ['message contract differs: /message']);
  assert.match(checkIcu('<b>{name}</b>', '<b>{name}</i>')[0], /^target/);
});

test('unsupported JSON values, mode, and locale fail explicitly', () => {
  assert.throws(() => validate({ x: ['text'] }, {}, 'de', 'icu'), /expected a string/);
  assert.throws(() => validate({ x: 42 }, {}, 'de', 'icu'), /expected a string/);
  assert.throws(() => validate({}, {}, 'de', 'vue'), /mode/);
  assert.throws(() => validate({}, {}, 'zz', 'icu'), /locale/);
});

test('CLI returns failure status for bad ICU, missing plurals, and unreadable JSON', () => {
  for (const args of [
    ['icu', 'fixtures/icu-en.json', 'fixtures/icu-de-renamed.json', 'de'],
    ['i18next', 'fixtures/i18next-en.json', 'fixtures/i18next-pl-missing.json', 'pl'],
    ['icu', 'package.json', 'check-json.mjs', 'de'],
  ]) {
    const result = spawnSync(process.execPath, ['check-json.mjs', ...args], { cwd: directory, encoding: 'utf8' });
    assert.equal(result.status, 1);
  }
});

test('CLI returns success status for both documented passing fixtures', () => {
  for (const args of [
    ['i18next', 'fixtures/i18next-en.json', 'fixtures/i18next-pl.json', 'pl'],
    ['icu', 'fixtures/icu-en.json', 'fixtures/icu-de.json', 'de'],
  ]) {
    const result = spawnSync(process.execPath, ['check-json.mjs', ...args], { cwd: directory, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  }
});

test('article commands and English source fixture match the runnable example', () => {
  const article = readFileSync(new URL('../../../kb/en-US/translate-json-files.mdx', import.meta.url), 'utf8');
  const commands = article.match(/```bash title="run-examples.sh"\n([\s\S]*?)\n```/);
  assert.ok(commands, 'article must include the tested example commands');
  assert.equal(`${commands[1]}\n`, readFileSync(new URL('run-examples.sh', import.meta.url), 'utf8'));
  const source = article.match(/```json title="locales\/en\/common.json"\n([\s\S]*?)\n```/);
  assert.deepEqual(JSON.parse(source[1]), english);
});
