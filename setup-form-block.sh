#!/usr/bin/env bash
#
# setup-form-block.sh
# Reproduces the Adaptive Form block setup on this repo so md2jcr recognizes
# the "Form" component. Run from the repo root, on the figmadesigns branch.
#
#   chmod +x setup-form-block.sh && ./setup-form-block.sh
#
# Then commit + push via GitHub Desktop.
set -euo pipefail

echo "==> 1/5  Fetching the official Adaptive Form block…"
rm -rf /tmp/bpf-form
git clone --depth 1 --filter=blob:none --sparse \
  https://github.com/adobe-rnd/aem-boilerplate-forms.git /tmp/bpf-form
( cd /tmp/bpf-form && git sparse-checkout set blocks/form )
rm -rf blocks/form
cp -r /tmp/bpf-form/blocks/form blocks/
rm -rf /tmp/bpf-form
test -f blocks/form/form.js && test -f blocks/form/form.css \
  && echo "    form block installed ($(find blocks/form -type f | wc -l | tr -d ' ') files)"

echo "==> 2/5  Registering \"form\" as a section child in models/_section.json…"
node - <<'NODE'
const fs = require('fs');
const p = 'models/_section.json';
const j = JSON.parse(fs.readFileSync(p, 'utf8'));
const f = (j.filters || []).find((x) => x.id === 'section');
if (f && !f.components.includes('form')) f.components.push('form');
fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
console.log('    section filter components:', f.components.join(', '));
NODE

echo "==> 3/5  Writing .eslintrc.js (form-aware rules)…"
cat > .eslintrc.js <<'ESLINTRC'
module.exports = {
  root: true,
  extends: [
    'airbnb-base',
    'plugin:json/recommended',
    'plugin:xwalk/recommended',
  ],
  env: {
    browser: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
  },
  rules: {
    'import/extensions': ['error', { js: 'always' }], // require js file extensions in imports
    'linebreak-style': ['error', 'unix'], // enforce unix linebreaks
    'no-param-reassign': [2, { props: false }], // allow modifying properties of param
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: ['**/*.test.js', '**/*.spec.js', 'playwright.config.js'],
    }],
    // Form components legitimately exceed default cell limits (per adobe-rnd/aem-boilerplate-forms)
    'xwalk/max-cells': ['error', {
      '*': 4,
      form: 17,
      wizard: 12,
      'form-button': 7,
      'checkbox-group': 20,
      checkbox: 19,
      'date-input': 21,
      'drop-down': 20,
      email: 22,
      'file-input': 20,
      'form-fragment': 16,
      'form-image': 7,
      'multiline-input': 23,
      'number-input': 22,
      panel: 17,
      'radio-group': 20,
      'form-reset-button': 7,
      'form-submit-button': 7,
      'telephone-input': 20,
      'text-input': 23,
      accordion: 14,
      modal: 11,
      rating: 18,
      password: 20,
      tnc: 12,
      range: 19,
    }],
    'xwalk/no-orphan-collapsible-fields': 'off', // Disable until enhancement is done for Forms properties
  },
};
ESLINTRC

echo "==> 4/5  Updating .eslintignore (ignore vendored rule-engine JS)…"
for line in \
  'blocks/form/rules/formula/*' \
  'blocks/form/rules/model/*' \
  'blocks/form/rules/functions.js' \
  'blocks/form/rules/index.js'; do
  grep -qxF "$line" .eslintignore 2>/dev/null || echo "$line" >> .eslintignore
done

echo "==> 5/5  Rebuilding aggregated component JSON…"
npm run build:json
echo
echo "    form component present: $(grep -c '"id": "form"' component-definition.json) (expect 1)"
echo
echo "==> Done. Review with 'git status', then commit + push via GitHub Desktop."
echo "    (Optional) run 'npm run lint' — 0 errors expected."
