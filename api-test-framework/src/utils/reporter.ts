export interface TestResult {
  testName: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  error?: string;
  responseTime?: number;
  timestamp: Date;
}

export interface TestSuiteResult {
  suiteName: string;
  results: TestResult[];
  startTime: Date;
  endTime: Date;
}

export const testResults: TestSuiteResult[] = [];

export const startTestSuite = (suiteName: string): TestSuiteResult => {
  const suite: TestSuiteResult = {
    suiteName,
    results: [],
    startTime: new Date(),
    endTime: new Date(),
  };
  testResults.push(suite);
  return suite;
};

export const recordTestResult = (
  suite: TestSuiteResult,
  testName: string,
  status: 'PASS' | 'FAIL' | 'SKIP',
  error?: string,
  responseTime?: number
): void => {
  suite.results.push({
    testName,
    status,
    error,
    responseTime,
    timestamp: new Date(),
  });
  suite.endTime = new Date();
};

export const getTestSummary = (): {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
} => {
  let total = 0;
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let duration = 0;

  testResults.forEach((suite) => {
    suite.results.forEach((result) => {
      total++;
      switch (result.status) {
        case 'PASS':
          passed++;
          break;
        case 'FAIL':
          failed++;
          break;
        case 'SKIP':
          skipped++;
          break;
      }
    });
    duration += suite.endTime.getTime() - suite.startTime.getTime();
  });

  return { total, passed, failed, skipped, duration };
};
