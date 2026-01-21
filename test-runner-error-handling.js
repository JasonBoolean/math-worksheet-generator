// Node.js test runner for error handling tests
const fs = require('fs');
const path = require('path');

// Mock browser globals
global.window = {
  addEventListener: () => {},
  navigator: { userAgent: 'Node.js Test Runner' },
  location: { href: 'http://localhost/test' }
};

global.document = {
  createElement: () => ({
    style: {},
    appendChild: () => {},
    remove: () => {},
    querySelectorAll: () => []
  }),
  getElementById: () => null,
  body: {
    appendChild: () => {},
    contains: () => false
  },
  head: {
    appendChild: () => {}
  }
};

global.navigator = global.window.navigator;

// Load the modules
const ErrorHandlerModule = require('./js/utils/ErrorHandler.js');
const ProgressIndicatorModule = require('./js/utils/ProgressIndicator.js');

// Make them global
global.ErrorHandler = ErrorHandlerModule.ErrorHandler;
global.AppError = ErrorHandlerModule.AppError;
global.ErrorTypes = ErrorHandlerModule.ErrorTypes;
global.ErrorSeverity = ErrorHandlerModule.ErrorSeverity;
global.globalErrorHandler = ErrorHandlerModule.globalErrorHandler;

global.ProgressIndicator = ProgressIndicatorModule.ProgressIndicator;
global.ProgressStates = ProgressIndicatorModule.ProgressStates;
global.globalProgressIndicator = ProgressIndicatorModule.globalProgressIndicator;

// Load test modules
const ErrorHandlerTests = require('./js/tests/ErrorHandler.test.js');
const ProgressIndicatorTests = require('./js/tests/ProgressIndicator.test.js');

// Run tests
console.log('Running Error Handling System Tests\n');
console.log('=' .repeat(60));

const errorHandlerResult = ErrorHandlerTests.runAll();
console.log('\n' + '='.repeat(60));

const progressIndicatorResult = ProgressIndicatorTests.runAll();
console.log('\n' + '='.repeat(60));

// Summary
console.log('\n\nTest Summary:');
console.log('ErrorHandler Tests:', errorHandlerResult ? '✓ PASSED' : '✗ FAILED');
console.log('ProgressIndicator Tests:', progressIndicatorResult ? '✓ PASSED' : '✗ FAILED');

const allPassed = errorHandlerResult && progressIndicatorResult;
console.log('\nOverall:', allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED');

process.exit(allPassed ? 0 : 1);
