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
    // table rows need one cell per column
    // (plan comparison tables: label + up to 6 plans; data tables: up to 6 columns)
    'xwalk/max-cells': ['error', {
      'table-plan-compare-row': 7,
      'table-plans-row': 7,
      'table-row': 6,
    }],
  },
};
