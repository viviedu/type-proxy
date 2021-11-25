module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint'
  ],
  parserOptions: {
    ecmaVersion: 2017
  },
  extends: [
    'eslint:recommended'
  ],
  env: {
    node: true,
    es6: true
  },
  ignorePatterns: ['dist/*'],
  rules: {
    'array-bracket-spacing': [
      'error',
      'never'
    ],
    'arrow-parens': [
      'error',
      'always'
    ],
    'eol-last': [
      'error',
      'always'
    ],
    'indent': [
      'error',
      2
    ],
    'keyword-spacing': [
      'error',
      {
        after: true,
        before: true
      }
    ],
    'no-console': 'error',
    'no-trailing-spaces': 'error',
    'no-multiple-empty-lines': [
      'error',
      {
        max: 1
      }
    ],
    'object-curly-spacing': [
      'error',
      'always'
    ],
    'quotes': [
      'error',
      'single'
    ],
    'semi': [
      'error',
      'always'
    ]
  },
  overrides: [
    {
      files: ['src/**/*.ts'],
      extends: [
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended'
      ]
    }
  ]
};
