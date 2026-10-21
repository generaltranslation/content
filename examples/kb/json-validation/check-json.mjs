import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, TYPE } from '@formatjs/icu-messageformat-parser';

// JSON Pointer paths distinguish a literal "nav.home" key from nested nav.home.
function flatten(object, path = '', result = new Map()) {
  if (!object || typeof object !== 'object' || Array.isArray(object)) {
    throw new Error(`expected an object at ${path || '/'}`);
  }
  for (const [key, value] of Object.entries(object)) {
    const pointer = `${path}/${key.replace(/~/g, '~0').replace(/\//g, '~1')}`;
    if (typeof value === 'string') result.set(pointer, value);
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      flatten(value, pointer, result);
    } else throw new Error(`expected a string or nested object at ${pointer}`);
  }
  return result;
}

const sorted = (values) => JSON.stringify([...values].sort());

// A deliberately limited i18next mode: default interpolation and simple tags.
function i18nextSignature(text) {
  const tokens = [];
  const withoutVariables = text.replace(/\{\{\s*(-?\s*[A-Za-z_][\w.]*)\s*\}\}/g, (_, name) => {
    tokens.push(`variable:${name.replace(/\s/g, '')}`);
    return '';
  });
  if (/[{}]/.test(withoutVariables) || /\$t\(/.test(withoutVariables)) {
    throw new Error('unsupported or malformed i18next interpolation');
  }
  const stack = [];
  const withoutTags = withoutVariables.replace(/<(\/?)([A-Za-z][\w-]*|\d+)(\s*\/?)>/g, (tag, closing, name, ending) => {
    const selfClosing = ending.includes('/');
    if (closing && selfClosing) throw new Error(`invalid tag: ${tag}`);
    if (closing && stack.pop() !== name) throw new Error(`unbalanced tag: ${tag}`);
    if (!closing && !selfClosing) stack.push(name);
    tokens.push(`tag:${closing ? '/' : ''}${name}${selfClosing ? '/' : ''}`);
    return '';
  });
  if (stack.length) throw new Error(`unclosed tag: ${stack.at(-1)}`);
  if (/[<>]/.test(withoutTags)) throw new Error('unsupported tag syntax or literal angle bracket');
  return sorted(tokens);
}

// Parse ICU instead of trying to recognize nested expressions with a regex.
// Compare message-wide argument types, tag names, and selector contracts.
// Plural categories can differ by locale; "other" remains required by the parser.
function icuSignature(text) {
  const contracts = new Set();
  function walk(elements) {
    for (const node of elements) {
      if (node.type === TYPE.literal || node.type === TYPE.pound) continue;
      contracts.add(`${TYPE[node.type]}:${node.value}`);
      if (node.type === TYPE.tag) walk(node.children);
      if (node.type === TYPE.select || node.type === TYPE.plural) {
        const selectors = Object.keys(node.options);
        const fixedSelectors = node.type === TYPE.select
          ? selectors
          : selectors.filter((selector) => selector.startsWith('='));
        contracts.add(JSON.stringify([
          TYPE[node.type], node.value, node.pluralType ?? '', node.offset ?? 0,
          fixedSelectors.sort(),
        ]));
        for (const option of Object.values(node.options)) walk(option.value);
      }
    }
  }
  walk(parse(text, { requiresOtherClause: true }));
  return sorted(contracts);
}

export function validate(sourceObject, targetObject, locale, mode) {
  if (!['i18next', 'icu'].includes(mode)) throw new Error('mode must be i18next or icu');
  if (!Intl.PluralRules.supportedLocalesOf([locale]).length) {
    throw new Error(`locale is not supported by this Node.js runtime: ${locale}`);
  }
  const source = flatten(sourceObject);
  const target = flatten(targetObject);
  const problems = [];
  const signature = mode === 'icu' ? icuSignature : i18nextSignature;
  const sourceSignatures = new Map();
  for (const [key, value] of source) {
    try { sourceSignatures.set(key, signature(value)); }
    catch (error) { problems.push(`source ${key}: ${error.message}`); }
  }

  // Each target key maps to a source key with the same interpolation contract.
  const expected = new Map([...source.keys()].map((key) => [key, key]));
  const optional = new Map();
  if (mode === 'i18next') {
    const suffix = /_(zero|one|two|few|many|other)$/;
    if ([...source.keys(), ...target.keys()].some((key) => /_ordinal_/.test(key))) {
      throw new Error('i18next ordinal keys are outside this example’s scope');
    }
    const bases = [...source.keys()].filter((key) => key.endsWith('_other'))
      .map((key) => key.slice(0, -6));
    const categories = new Intl.PluralRules(locale).resolvedOptions().pluralCategories;
    for (const base of bases) {
      for (const key of source.keys()) {
        if (suffix.test(key) && key.replace(suffix, '') === base) expected.delete(key);
      }
      for (const category of categories) {
        const key = `${base}_${category}`;
        expected.set(key, source.has(key) ? key : `${base}_other`);
      }
      // i18next permits a special zero form even when CLDR has no zero category.
      if (!expected.has(`${base}_zero`)) {
        optional.set(`${base}_zero`, source.has(`${base}_zero`) ? `${base}_zero` : `${base}_other`);
      }
    }
  }
  for (const key of expected.keys()) {
    if (!target.has(key)) problems.push(`missing key: ${key}`);
  }
  for (const [key, value] of target) {
    const sourceKey = expected.get(key) ?? optional.get(key);
    if (!sourceKey) { problems.push(`extra key: ${key}`); continue; }
    try {
      if (signature(value) !== sourceSignatures.get(sourceKey)) {
        problems.push(`message contract differs: ${key}`);
      }
    } catch (error) { problems.push(`target ${key}: ${error.message}`); }
  }
  return problems;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [mode, src, out, locale, ...extra] = process.argv.slice(2);
    if (!mode || !src || !out || !locale || extra.length) {
      throw new Error('usage: node check-json.mjs <i18next|icu> <source.json> <target.json> <target-locale>');
    }
    const problems = validate(
      JSON.parse(readFileSync(src, 'utf8')),
      JSON.parse(readFileSync(out, 'utf8')),
      locale,
      mode,
    );
    console.log(problems.length ? problems.join('\n') : 'OK: structural checks passed');
    process.exitCode = problems.length ? 1 : 0;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
