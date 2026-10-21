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
  },
  overrides: [
    {
      // Adaptive Form field components (blocks/form, from aem-boilerplate-forms)
      // render as form fields, not block tables: allow their larger models.
      files: ['component-models.json'],
      rules: {
        'xwalk/max-cells': ['error', {
          accordion: 40,
          checkbox: 40,
          'checkbox-group': 40,
          'date-input': 40,
          'drop-down': 40,
          email: 40,
          'file-input': 40,
          'form-button': 40,
          'form-fragment': 40,
          'form-image': 40,
          'form-reset-button': 40,
          'form-submit-button': 40,
          modal: 40,
          'multiline-input': 40,
          'number-input': 40,
          panel: 40,
          password: 40,
          'radio-group': 40,
          range: 40,
          rating: 40,
          'telephone-input': 40,
          'text-input': 40,
          tnc: 40,
          wizard: 40,
        }],
        'xwalk/no-orphan-collapsible-fields': 'off',
      },
    },
  ],
};
