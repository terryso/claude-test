module.exports = {
  env: {
    browser: false,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Code style
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    
    // Best practices
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-console': 'off', // Allow console in CLI tool
    'no-process-exit': 'off', // Allow process.exit in CLI
    
    // ES6+
    'prefer-const': 'error',
    'no-var': 'error',
    'prefer-arrow-callback': 'error',
    
    // Node.js
    'no-path-concat': 'error',
    'no-process-env': 'off', // Allow process.env usage
    
    // Error prevention
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-unused-expressions': 'error'
  },
  overrides: [
    {
      files: ['**/*.test.js'],
      env: {
        jest: true
      },
      rules: {
        'no-unused-expressions': 'off' // Allow expect().toBe() etc.
      }
    },
    {
      files: ['scripts/**/*.js'],
      rules: {
        'no-console': 'off' // Allow console in scripts
      }
    }
  ]
};