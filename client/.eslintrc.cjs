module.exports = {
  root: true,
  env: { browser: true, es2021: true },
  ignorePatterns: ['node_modules/', 'dist/', 'coverage/'],
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Minimal rules - everything else is warnings/off
    'no-unused-vars': 'warn',
    'no-console': 'off'
  }
};


