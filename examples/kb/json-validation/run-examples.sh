set -eu
npm ci --ignore-scripts
npm test
node check-json.mjs i18next fixtures/i18next-en.json fixtures/i18next-pl.json pl
node check-json.mjs icu fixtures/icu-en.json fixtures/icu-de.json de
