# Locale matching example

Reproduce the script and regional fallback examples in the [locale codes article](https://generaltranslation.com/kb/locale-codes).

Requires Node.js 20 or later. This folder is an independent npm example; its dependencies are pinned in `package-lock.json`.

```bash
npm ci
npm test
```

`locale-matching.mjs` uses `@formatjs/intl-localematcher` 0.9.0 with best-fit matching. The tests cover Chinese scripts, Portuguese regional variants, an ordered preference list, the default fallback, and invalid language ranges. Raw `Accept-Language` headers need parsing and filtering before reaching this function; `*` is not a locale tag.
