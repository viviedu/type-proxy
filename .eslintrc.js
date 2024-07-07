const rules = {
  '@typescript-eslint/ban-ts-comment': [0],
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      args: 'none',
      // ignore arguments since we can't mark unused with underscores
      varsIgnorePattern: '^_'
    }
  ],
  '@typescript-eslint/space-infix-ops': 'error',
  '@typescript-eslint/type-annotation-spacing': ['error', {
    after: true,
    before: false,
    overrides: {
      arrow: {
        after: true,
        before: true
      }
    }
  }],
  'arrow-parens': ['error', 'always'],
  'arrow-spacing': ['error', { after: true, before: true }],
  'brace-style': ['error'],
  'comma-dangle': ['error', 'never'],
  'comma-spacing': ['error', { after: true, before: false }],
  curly: ['error', 'all'],
  'dot-notation': ['error'],
  'eol-last': ['error'],
  indent: ['error', 2, { SwitchCase: 1 }],
  'jsx-quotes': ['error', 'prefer-double'],
  'key-spacing': ['error', { mode: 'strict' }],
  'keyword-spacing': ['error', { overrides: { catch: { after: true } } }],
  'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 1 }],
  'no-trailing-spaces': ['error'],
  'object-curly-spacing': ['error', 'always'],
  'object-shorthand': ['error', 'properties'],
  'one-var': ['error', 'never'],
  'padded-blocks': ['error', 'never'],
  'prefer-const': ['error', { destructuring: 'any' }],
  'prefer-destructuring': ['error', { AssignmentExpression: { array: false, object: false }, VariableDeclarator: { array: false, object: true } }], // array suggests pointlessly replacing foo[0],
  'prefer-template': ['error'],
  'quote-props': ['error', 'as-needed'],
  quotes: [2, 'single', { avoidEscape: true }],
  semi: ['error', 'always'],
  'space-before-blocks': ['error', 'always'],
  'space-before-function-paren': ['error', { asyncArrow: 'always', named: 'never' }],
  'space-in-parens': ['error'],
  'space-infix-ops': 'off',
  'space-unary-ops': ['error'],
  'template-curly-spacing': ['error', 'never']
};

const importRules = {
  'import/default': 'off',
  'import/namespace': 'off',
  'import/no-duplicates': 'off',
  'import/no-named-as-default': 'off',
  'import/no-unresolved': 'error',
  'import/order': [
    'error',
    {
      alphabetize: {
        caseInsensitive: false,
        order: 'asc'
      },
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index']
    }
  ]
};

module.exports = {
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript'
  ],
  ignorePatterns: ['**/*.js'],
  overrides: [],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  rules: {
    ...rules,
    ...importRules
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts']
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json'
      }
    }
  }
};
