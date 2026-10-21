# JSON locale validation example

Runnable examples for [How to translate JSON locale files](https://generaltranslation.com/kb/translate-json-files).
These files demonstrate structural checks. The translations are hand-written test fixtures, not recorded API output or a translation-quality benchmark.

## Run

Use Node.js 20 or later with ICU locale data for your target languages. From this directory:

```bash
sh run-examples.sh
```

The script installs the locked dependencies, runs the tests, and checks the passing Polish i18next and German ICU fixtures. No API key is needed. The only network operation is dependency installation.

To validate your own files:

```bash
node check-json.mjs i18next source.json target.json pl
node check-json.mjs icu source.json target.json de
```

The process exits with status 0 when the checks pass and 1 for validation, parsing, file, or usage errors. Key paths in diagnostics use JSON Pointer escaping, so a literal dotted key cannot collide with a nested key.

## Scope

Both modes accept JSON objects containing strings or nested objects. They check string entry paths; they do not compare empty containers. Arrays and other value types are rejected. JSON syntax is checked by `JSON.parse`; duplicate object member names are not detected.

- **i18next:** default double-brace interpolation, simple paired or self-closing tags without attributes, and JSON v4 cardinal plural families. A source key ending in `_other` declares a plural family. Required target categories come from the runtime's `Intl.PluralRules`; an optional `_zero` key is also allowed. Each added target form is compared with the source `_other` form, unless the source has the same category. Variables must match that source form. This is a conservative policy: adapt it when a legitimate translation intentionally omits a variable. Ordinal keys, formatters, nesting calls, custom delimiters, literal braces/angle brackets, and HTML attributes are outside this example's scope. This is not a validator for vue-i18n pipe messages.
- **ICU:** the pinned FormatJS parser checks syntax, including nested plural/select messages and rich-text tags. Message-wide sets compare argument names and types, tag names, select cases, exact-number selectors, and plural offsets. Category branches may vary, and the parser requires `other`. These checks do not validate branch-by-branch argument placement, argument repetition, `#` placement, rich-text placement, number/date styles, application-specific runtime behavior, or translation quality.

A passing result is not a promise that the translation is correct. Compile messages with your application's tooling and review important text in context.

## Reproduced results

Run on Node.js 24.19.0 with `@formatjs/icu-messageformat-parser` 3.5.22 on October 21, 2026. The package version is exact and the transitive dependency is locked in `package-lock.json`.

| Input pair | Mode | Exit status |
| --- | --- | --- |
| `i18next-en.json` → `i18next-pl.json` | i18next | 0 |
| `i18next-en.json` → `i18next-pl-missing.json` | i18next | 1 |
| `icu-en.json` → `icu-de.json` | ICU | 0 |
| `icu-en.json` → `icu-de-renamed.json` | ICU | 1 |
| `icu-en.json` → `icu-de-malformed.json` | ICU | 1 |

All 19 tests passed. They include Arabic expansion, Japanese contraction, placeholders in new plural forms, malformed markup, nested ICU messages, renamed arguments, CLI exit status, and unsupported inputs. A synchronization test ensures the article's command block and English JSON fixture match these files. Run this example's `npm test` when editing either the article or the example.

The failing fixtures can be run directly:

```bash
node check-json.mjs i18next fixtures/i18next-en.json fixtures/i18next-pl-missing.json pl
node check-json.mjs icu fixtures/icu-en.json fixtures/icu-de-renamed.json de
node check-json.mjs icu fixtures/icu-en.json fixtures/icu-de-malformed.json de
```

The validator only reads files; it does not translate or modify them.
