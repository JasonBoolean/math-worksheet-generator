/**
 * Unit Tests for ErrorHandler
 * Tests error classification, handling, and recovery mechanisms
 */

// Test helper to create mock UI callback
function createMockUICallback() {
  const calls = [];
  const callback = (data) => {
    calls.push(data);
  };
  callback.getCalls = () => calls;
  callback.getLastCall = () => calls[calls.length - 1];
  callback.clear = () => calls.length = 0;
  return callback;
}

// Test Suite
const ErrorHandlerTests = {
  /**
   * Test error classification
   */
  testErrorClassification() {
    console.log('Testing error classification...');
    
    const handler = new ErrorHandler();
    
    // Test validation error
    const validationError = new Error('Invalid parameter: value must be positive');
    const classified1 = handler.classifyError(validationError);
    console.assert(classified1.type === ErrorTypes.VALIDATION, 'Should classify as validation error');
    console.assert(classified1.severity === ErrorSeverity.LOW, 'Validation errors should be low severity');
    
    // Test rendering error
    const renderError = new Error('Canvas rendering failed');
    const classified2 = handler.classifyError(renderError);
    console.assert(classified2.type === ErrorTypes.RENDERING, 'Should classify as rendering error');
    
    // Test export error
    const exportError = new Error('Failed to export blob');
    const classified3 = handler.classifyError(exportError);
    console.assert(classified3.type === ErrorTypes.EXPORT, 'Should classify as export error');
    
    // Test storage error
    const storageError = new Error('QuotaExceededError: localStorage is full');
    const classified4 = handler.classifyError(storageError);
    console.assert(classified4.type === ErrorTypes.STORAGE, 'Should classify as storage error');
    
    // Test compatibility error
    const compatError = new Error('Function not supported in this browser');
    const classified5 = handler.classifyError(compatError);
    console.assert(classified5.type === ErrorTypes.COMPATIBILITY, 'Should classify as compatibility error');
    
    console.log('✓ Error classification tests passed');
  },

  /**
   * Test AppError creation
   */
  testAppErrorCreation() {
    console.log('Testing AppError creation...');
    
    const error = new AppError(
      'Test error message',
      ErrorTypes.VALIDATION,
      ErrorSeverity.MEDIUM,
      { field: 'difficulty' }
    );
    
    console.assert(error.message === 'Test error message', 'Should have correct message');
    console.assert(error.type === ErrorTypes.VALIDATION, 'Should have correct type');
    console.assert(error.severity === ErrorSeverity.MEDIUM, 'Should have correct severity');
    console.assert(error.context.field === 'difficulty', 'Should have correct context');
    console.assert(error.userMessage !== undefined, 'Should have user message');
    console.assert(error.timestamp instanceof Date, 'Should have timestamp');
    
    console.log('✓ AppError creation tests passed');
  },

  /**
   * Test user-friendly messages
   */
  testUserFriendlyMessages() {
    console.log('Testing user-friendly messages...');
    
    const validationError = new AppError('Invalid input', ErrorTypes.VALIDATION);
    console.assert(
      validationError.userMessage.includes('参数'),
      'Validation error should have user-friendly message'
    );
    
    const renderError = new AppError('Render failed', ErrorTypes.RENDERING);
    console.assert(
      renderError.userMessage.includes('渲染'),
      'Rendering error should have user-friendly message'
    );
    
    const exportError = new AppError('Export failed', ErrorTypes.EXPORT);
    console.assert(
      exportError.userMessage.includes('导出'),
      'Export error should have user-friendly message'
    );
    
    console.log('✓ User-friendly message tests passed');
  },

  /**
   * Test recovery suggestions
   */
  testRecoverySuggestions() {
    console.log('Testing recovery suggestions...');
    
    const error = new AppError('Test error', ErrorTypes.VALIDATION);
    const suggestions = error.getRecoverySuggestions();
    
    console.assert(Array.isArray(suggestions), 'Should return array of suggestions');
    console.assert(suggestions.length > 0, 'Should have at least one suggestion');
    console.assert(typeof suggestions[0] === 'string', 'Suggestions should be strings');
    
    console.log('✓ Recovery suggestion tests passed');
  },

  /**
   * Test error logging
   */
  testErrorLogging() {
    console.log('Testing error logging...');
    
    const handler = new ErrorHandler();
    const error = new AppError('Test error', ErrorTypes.SYSTEM);
    
    const initialLogSize = handler.errorLog.length;
    handler.logError(error);
    
    console.assert(
      handler.errorLog.length === initialLogSize + 1,
      'Should add error to log'
    );
    
    const logEntry = handler.errorLog[handler.errorLog.length - 1];
    console.assert(logEntry.error === error, 'Should log the error');
    console.assert(logEntry.timestamp instanceof Date, 'Should have timestamp');
    console.assert(typeof logEntry.userAgent === 'string', 'Should have user agent');
    
    console.log('✓ Error logging tests passed');
  },

  /**
   * Test error log size limit
   */
  testErrorLogSizeLimit() {
    console.log('Testing error log size limit...');
    
    const handler = new ErrorHandler();
    handler.maxLogSize = 5;
    
    // Add more errors than the limit
    for (let i = 0; i < 10; i++) {
      handler.logError(new AppError(`Error ${i}`, ErrorTypes.SYSTEM));
    }
    
    console.assert(
      handler.errorLog.length <= handler.maxLogSize,
      'Should not exceed max log size'
    );
    
    console.log('✓ Error log size limit tests passed');
  },

  /**
   * Test UI callback integration
   */
  testUICallback() {
    console.log('Testing UI callback integration...');
    
    const handler = new ErrorHandler();
    const mockCallback = createMockUICallback();
    handler.setUICallback(mockCallback);
    
    const error = new AppError('Test error', ErrorTypes.VALIDATION);
    handler.displayError(error);
    
    const calls = mockCallback.getCalls();
    console.assert(calls.length === 1, 'Should call UI callback once');
    
    const callData = calls[0];
    console.assert(callData.type === 'error', 'Should pass error type');
    console.assert(typeof callData.message === 'string', 'Should pass message');
    console.assert(Array.isArray(callData.suggestions), 'Should pass suggestions');
    
    console.log('✓ UI callback tests passed');
  },

  /**
   * Test retry logic
   */
  testRetryLogic() {
    console.log('Testing retry logic...');
    
    const handler = new ErrorHandler();
    
    // Validation errors should not retry
    const validationError = new AppError('Invalid', ErrorTypes.VALIDATION);
    console.assert(
      !handler.shouldRetry(validationError, 'test-op'),
      'Should not retry validation errors'
    );
    
    // Compatibility errors should not retry
    const compatError = new AppError('Not supported', ErrorTypes.COMPATIBILITY);
    console.assert(
      !handler.shouldRetry(compatError, 'test-op'),
      'Should not retry compatibility errors'
    );
    
    // Other errors should retry up to max attempts
    const renderError = new AppError('Render failed', ErrorTypes.RENDERING);
    console.assert(
      handler.shouldRetry(renderError, 'test-op-2'),
      'Should retry rendering errors'
    );
    
    // Simulate max retries
    handler.retryAttempts.set('test-op-3', 3);
    console.assert(
      !handler.shouldRetry(renderError, 'test-op-3'),
      'Should not retry after max attempts'
    );
    
    console.log('✓ Retry logic tests passed');
  },

  /**
   * Test safe defaults fallback
   */
  testSafeDefaultsFallback() {
    console.log('Testing safe defaults fallback...');
    
    const handler = new ErrorHandler();
    const safeConfig = handler.fallbackToSafeDefaults({});
    
    console.assert(typeof safeConfig === 'object', 'Should return object');
    console.assert(safeConfig.difficulty !== undefined, 'Should have difficulty');
    console.assert(safeConfig.operationType !== undefined, 'Should have operation type');
    console.assert(safeConfig.layout !== undefined, 'Should have layout');
    console.assert(safeConfig.backgroundStyle !== undefined, 'Should have background style');
    
    console.log('✓ Safe defaults fallback tests passed');
  },

  /**
   * Test error statistics
   */
  testErrorStatistics() {
    console.log('Testing error statistics...');
    
    const handler = new ErrorHandler();
    
    // Add various errors
    handler.logError(new AppError('Error 1', ErrorTypes.VALIDATION, ErrorSeverity.LOW));
    handler.logError(new AppError('Error 2', ErrorTypes.RENDERING, ErrorSeverity.MEDIUM));
    handler.logError(new AppError('Error 3', ErrorTypes.VALIDATION, ErrorSeverity.LOW));
    
    const stats = handler.getErrorStats();
    
    console.assert(stats.total === 3, 'Should count total errors');
    console.assert(stats.byType[ErrorTypes.VALIDATION] === 2, 'Should count by type');
    console.assert(stats.byType[ErrorTypes.RENDERING] === 1, 'Should count by type');
    console.assert(stats.bySeverity[ErrorSeverity.LOW] === 2, 'Should count by severity');
    console.assert(Array.isArray(stats.recent), 'Should have recent errors');
    
    console.log('✓ Error statistics tests passed');
  },

  /**
   * Test error log export
   */
  testErrorLogExport() {
    console.log('Testing error log export...');
    
    const handler = new ErrorHandler();
    handler.logError(new AppError('Test error', ErrorTypes.SYSTEM));
    
    const exported = handler.exportErrorLog();
    console.assert(typeof exported === 'string', 'Should export as string');
    
    const parsed = JSON.parse(exported);
    console.assert(Array.isArray(parsed), 'Should be valid JSON array');
    console.assert(parsed.length > 0, 'Should contain errors');
    
    console.log('✓ Error log export tests passed');
  },

  /**
   * Test error log clearing
   */
  testErrorLogClearing() {
    console.log('Testing error log clearing...');
    
    const handler = new ErrorHandler();
    handler.logError(new AppError('Test error', ErrorTypes.SYSTEM));
    handler.retryAttempts.set('test-op', 2);
    
    console.assert(handler.errorLog.length > 0, 'Should have errors before clear');
    console.assert(handler.retryAttempts.size > 0, 'Should have retry attempts before clear');
    
    handler.clearErrorLog();
    
    console.assert(handler.errorLog.length === 0, 'Should clear error log');
    console.assert(handler.retryAttempts.size === 0, 'Should clear retry attempts');
    
    console.log('✓ Error log clearing tests passed');
  },

  /**
   * Run all tests
   */
  runAll() {
    console.log('=== Running ErrorHandler Tests ===\n');
    
    try {
      this.testErrorClassification();
      this.testAppErrorCreation();
      this.testUserFriendlyMessages();
      this.testRecoverySuggestions();
      this.testErrorLogging();
      this.testErrorLogSizeLimit();
      this.testUICallback();
      this.testRetryLogic();
      this.testSafeDefaultsFallback();
      this.testErrorStatistics();
      this.testErrorLogExport();
      this.testErrorLogClearing();
      
      console.log('\n=== All ErrorHandler Tests Passed ✓ ===');
      return true;
    } catch (error) {
      console.error('\n=== ErrorHandler Tests Failed ✗ ===');
      console.error(error);
      return false;
    }
  }
};

// Export for use in test runners
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorHandlerTests;
} else {
  window.ErrorHandlerTests = ErrorHandlerTests;
}
