const { defaults } = require('jest-config');

module.exports = {
  testEnvironment: 'node',
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts', 'tsx', 'js'],
  testMatch: ['<rootDir>/src/tests/**/*.test.js', '<rootDir>/src/tests/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/out/'],
  verbose: true
};
