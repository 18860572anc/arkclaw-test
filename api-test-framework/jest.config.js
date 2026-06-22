module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['node_modules', 'dist'],
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'text', 'lcov'],
  reporters: [
    'default',
    ['jest-html-reporter', {
      outputPath: 'reports/test-report.html',
      pageTitle: 'ArkClaw API 测试报告',
      includeFailureMsg: true,
      includeConsoleLog: true,
    }],
  ],
  setupFiles: ['dotenv/config'],
  moduleFileExtensions: ['ts', 'js', 'json'],
};
