/**
 * Unit Tests for ProgressIndicator
 * Tests progress tracking and status feedback functionality
 */

// Test Suite
const ProgressIndicatorTests = {
  /**
   * Test initialization
   */
  testInitialization() {
    console.log('Testing ProgressIndicator initialization...');
    
    const indicator = new ProgressIndicator();
    
    console.assert(indicator.currentState === ProgressStates.IDLE, 'Should start in IDLE state');
    console.assert(indicator.progressValue === 0, 'Should start with 0 progress');
    console.assert(indicator.operations instanceof Map, 'Should have operations map');
    console.assert(Array.isArray(indicator.messageQueue), 'Should have message queue');
    
    console.log('✓ Initialization tests passed');
  },

  /**
   * Test operation start
   */
  testOperationStart() {
    console.log('Testing operation start...');
    
    const indicator = new ProgressIndicator();
    
    // Create mock elements
    const mockOverlay = document.createElement('div');
    mockOverlay.id = 'loading-overlay';
    const mockText = document.createElement('p');
    mockOverlay.appendChild(mockText);
    document.body.appendChild(mockOverlay);
    
    indicator.initialize({ loadingOverlay: mockOverlay, loadingText: mockText });
    
    indicator.startOperation('test-op', 'Testing operation', { showProgress: true });
    
    console.assert(indicator.operations.has('test-op'), 'Should track operation');
    console.assert(indicator.currentState === ProgressStates.LOADING, 'Should be in LOADING state');
    
    const operation = indicator.operations.get('test-op');
    console.assert(operation.message === 'Testing operation', 'Should have correct message');
    console.assert(operation.progress === 0, 'Should start with 0 progress');
    
    // Cleanup
    document.body.removeChild(mockOverlay);
    
    console.log('✓ Operation start tests passed');
  },

  /**
   * Test progress update
   */
  testProgressUpdate() {
    console.log('Testing progress update...');
    
    const indicator = new ProgressIndicator();
    
    indicator.startOperation('test-op', 'Testing', { total: 100 });
    indicator.updateProgress('test-op', 50, 'Half done');
    
    const operation = indicator.operations.get('test-op');
    console.assert(operation.progress === 50, 'Should update progress');
    console.assert(operation.message === 'Half done', 'Should update message');
    
    console.log('✓ Progress update tests passed');
  },

  /**
   * Test operation completion
   */
  testOperationCompletion() {
    console.log('Testing operation completion...');
    
    const indicator = new ProgressIndicator();
    
    indicator.startOperation('test-op', 'Testing');
    console.assert(indicator.operations.has('test-op'), 'Should have operation');
    
    indicator.completeOperation('test-op', 'Done', { showMessage: false });
    console.assert(!indicator.operations.has('test-op'), 'Should remove completed operation');
    console.assert(indicator.currentState === ProgressStates.SUCCESS, 'Should be in SUCCESS state');
    
    console.log('✓ Operation completion tests passed');
  },

  /**
   * Test operation failure
   */
  testOperationFailure() {
    console.log('Testing operation failure...');
    
    const indicator = new ProgressIndicator();
    
    indicator.startOperation('test-op', 'Testing');
    indicator.failOperation('test-op', 'Failed', { showMessage: false });
    
    console.assert(!indicator.operations.has('test-op'), 'Should remove failed operation');
    console.assert(indicator.currentState === ProgressStates.ERROR, 'Should be in ERROR state');
    
    console.log('✓ Operation failure tests passed');
  },

  /**
   * Test operation cancellation
   */
  testOperationCancellation() {
    console.log('Testing operation cancellation...');
    
    const indicator = new ProgressIndicator();
    
    indicator.startOperation('test-op', 'Testing');
    console.assert(indicator.operations.has('test-op'), 'Should have operation');
    
    indicator.cancelOperation('test-op');
    console.assert(!indicator.operations.has('test-op'), 'Should remove cancelled operation');
    
    console.log('✓ Operation cancellation tests passed');
  },

  /**
   * Test multiple operations
   */
  testMultipleOperations() {
    console.log('Testing multiple operations...');
    
    const indicator = new ProgressIndicator();
    
    indicator.startOperation('op1', 'Operation 1');
    indicator.startOperation('op2', 'Operation 2');
    indicator.startOperation('op3', 'Operation 3');
    
    console.assert(indicator.operations.size === 3, 'Should track multiple operations');
    console.assert(indicator.isOperationInProgress(), 'Should report operations in progress');
    
    indicator.completeOperation('op1', 'Done', { showMessage: false });
    console.assert(indicator.operations.size === 2, 'Should have 2 operations left');
    
    indicator.completeOperation('op2', 'Done', { showMessage: false });
    indicator.completeOperation('op3', 'Done', { showMessage: false });
    console.assert(indicator.operations.size === 0, 'Should have no operations');
    console.assert(!indicator.isOperationInProgress(), 'Should report no operations in progress');
    
    console.log('✓ Multiple operations tests passed');
  },

  /**
   * Test loading overlay
   */
  testLoadingOverlay() {
    console.log('Testing loading overlay...');
    
    const indicator = new ProgressIndicator();
    
    // Create mock overlay
    const mockOverlay = document.createElement('div');
    mockOverlay.id = 'loading-overlay';
    mockOverlay.style.display = 'none';
    const mockText = document.createElement('p');
    mockOverlay.appendChild(mockText);
    document.body.appendChild(mockOverlay);
    
    indicator.initialize({ loadingOverlay: mockOverlay, loadingText: mockText });
    
    indicator.showLoading('Testing...');
    console.assert(mockOverlay.style.display === 'flex', 'Should show overlay');
    console.assert(mockText.textContent === 'Testing...', 'Should set message');
    
    indicator.hideLoading();
    console.assert(mockOverlay.style.display === 'none', 'Should hide overlay');
    
    // Cleanup
    document.body.removeChild(mockOverlay);
    
    console.log('✓ Loading overlay tests passed');
  },

  /**
   * Test toast notifications
   */
  testToastNotifications() {
    console.log('Testing toast notifications...');
    
    const indicator = new ProgressIndicator();
    indicator.createMessageContainer();
    
    console.assert(indicator.messageContainer !== null, 'Should create message container');
    
    // Test different toast types
    indicator.showSuccess('Success message', 100);
    indicator.showError('Error message', 100);
    indicator.showWarning('Warning message', 100);
    indicator.showInfo('Info message', 100);
    
    // Wait a bit for toasts to be created
    setTimeout(() => {
      const toasts = indicator.messageContainer.querySelectorAll('.toast');
      console.assert(toasts.length === 4, 'Should create 4 toasts');
      
      // Cleanup
      indicator.clearMessages();
      console.assert(
        indicator.messageContainer.children.length === 0,
        'Should clear all messages'
      );
    }, 50);
    
    console.log('✓ Toast notification tests passed');
  },

  /**
   * Test state management
   */
  testStateManagement() {
    console.log('Testing state management...');
    
    const indicator = new ProgressIndicator();
    
    console.assert(indicator.getState() === ProgressStates.IDLE, 'Should start in IDLE');
    
    indicator.currentState = ProgressStates.LOADING;
    console.assert(indicator.getState() === ProgressStates.LOADING, 'Should update state');
    
    indicator.currentState = ProgressStates.SUCCESS;
    console.assert(indicator.getState() === ProgressStates.SUCCESS, 'Should update state');
    
    indicator.currentState = ProgressStates.ERROR;
    console.assert(indicator.getState() === ProgressStates.ERROR, 'Should update state');
    
    console.log('✓ State management tests passed');
  },

  /**
   * Test active operations retrieval
   */
  testActiveOperationsRetrieval() {
    console.log('Testing active operations retrieval...');
    
    const indicator = new ProgressIndicator();
    
    indicator.startOperation('op1', 'Operation 1');
    indicator.startOperation('op2', 'Operation 2');
    
    const activeOps = indicator.getActiveOperations();
    console.assert(Array.isArray(activeOps), 'Should return array');
    console.assert(activeOps.length === 2, 'Should have 2 active operations');
    console.assert(activeOps[0].id === 'op1', 'Should have correct operation');
    console.assert(activeOps[1].id === 'op2', 'Should have correct operation');
    
    console.log('✓ Active operations retrieval tests passed');
  },

  /**
   * Test progress bar creation
   */
  testProgressBarCreation() {
    console.log('Testing progress bar creation...');
    
    const indicator = new ProgressIndicator();
    
    // Create mock overlay
    const mockOverlay = document.createElement('div');
    mockOverlay.id = 'loading-overlay';
    document.body.appendChild(mockOverlay);
    
    indicator.initialize({ loadingOverlay: mockOverlay });
    
    console.assert(indicator.progressBar !== null, 'Should create progress bar');
    console.assert(indicator.progressBar.id === 'progress-bar', 'Should have correct ID');
    
    // Cleanup
    document.body.removeChild(mockOverlay);
    
    console.log('✓ Progress bar creation tests passed');
  },

  /**
   * Test message container creation
   */
  testMessageContainerCreation() {
    console.log('Testing message container creation...');
    
    const indicator = new ProgressIndicator();
    indicator.createMessageContainer();
    
    console.assert(indicator.messageContainer !== null, 'Should create container');
    console.assert(indicator.messageContainer.id === 'message-container', 'Should have correct ID');
    console.assert(
      document.body.contains(indicator.messageContainer),
      'Should be added to body'
    );
    
    // Cleanup
    if (indicator.messageContainer && indicator.messageContainer.parentNode) {
      indicator.messageContainer.parentNode.removeChild(indicator.messageContainer);
    }
    
    console.log('✓ Message container creation tests passed');
  },

  /**
   * Run all tests
   */
  runAll() {
    console.log('=== Running ProgressIndicator Tests ===\n');
    
    try {
      this.testInitialization();
      this.testOperationStart();
      this.testProgressUpdate();
      this.testOperationCompletion();
      this.testOperationFailure();
      this.testOperationCancellation();
      this.testMultipleOperations();
      this.testLoadingOverlay();
      this.testToastNotifications();
      this.testStateManagement();
      this.testActiveOperationsRetrieval();
      this.testProgressBarCreation();
      this.testMessageContainerCreation();
      
      console.log('\n=== All ProgressIndicator Tests Passed ✓ ===');
      return true;
    } catch (error) {
      console.error('\n=== ProgressIndicator Tests Failed ✗ ===');
      console.error(error);
      return false;
    }
  }
};

// Export for use in test runners
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProgressIndicatorTests;
} else {
  window.ProgressIndicatorTests = ProgressIndicatorTests;
}
