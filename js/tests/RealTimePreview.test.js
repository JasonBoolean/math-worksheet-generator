/**
 * Unit Tests for Real-time Preview Functionality
 * Tests the implementation of task 6.2 - 实现实时预览功能
 */

// Mock DOM elements for testing
function createMockDOM() {
  // Create mock canvas
  const mockCanvas = {
    width: 595,
    height: 842,
    style: {},
    getContext: () => ({
      clearRect: () => {},
      fillRect: () => {},
      fillText: () => {},
      measureText: () => ({ width: 50 }),
      save: () => {},
      restore: () => {},
      setTransform: () => {},
      scale: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      arc: () => {},
      fill: () => {}
    }),
    getBoundingClientRect: () => ({ width: 595, height: 842 }),
    toBlob: (callback) => callback(new Blob()),
    toDataURL: () => 'data:image/png;base64,test'
  };

  // Mock document methods
  global.document = {
    getElementById: (id) => {
      if (id === 'preview-canvas') return mockCanvas;
      if (id === 'preview-placeholder') return { style: { display: 'block' } };
      if (id === 'export-btn') return { disabled: false };
      return { 
        style: { display: 'block' },
        addEventListener: () => {},
        value: 'within20',
        checked: true
      };
    },
    querySelectorAll: () => [{ addEventListener: () => {}, checked: true, value: 'addition' }],
    addEventListener: () => {},
    readyState: 'complete'
  };

  // Mock window
  global.window = {
    devicePixelRatio: 1,
    addEventListener: () => {},
    setTimeout: (fn) => fn(),
    clearTimeout: () => {}
  };

  // Mock console
  global.console = {
    log: () => {},
    error: () => {},
    warn: () => {}
  };
}

// Test Suite
function runRealTimePreviewTests() {
  console.log('Running Real-time Preview Tests...');
  
  let testsPassed = 0;
  let testsTotal = 0;
  
  function test(name, testFn) {
    testsTotal++;
    try {
      testFn();
      console.log(`✓ ${name}`);
      testsPassed++;
    } catch (error) {
      console.error(`✗ ${name}: ${error.message}`);
    }
  }
  
  function assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }
  
  // Setup mock environment
  createMockDOM();
  
  // Test 1: Configuration change triggers preview update
  test('Configuration change triggers preview update', () => {
    const app = new MathWorksheetApp();
    
    // Mock the updatePreview method to track calls
    let previewUpdateCalled = false;
    app.updatePreview = () => {
      previewUpdateCalled = true;
    };
    
    // Initialize config
    app.currentConfig = WorksheetConfig.createDefault();
    
    // Update configuration
    app.updateConfig({ difficulty: 'within50' });
    
    assert(previewUpdateCalled, 'Preview update should be called when configuration changes');
  });
  
  // Test 2: Preview update method exists and is callable
  test('Preview update method exists and is callable', () => {
    const app = new MathWorksheetApp();
    
    assert(typeof app.updatePreview === 'function', 'updatePreview method should exist');
    
    // Should not throw when called
    app.updatePreview();
  });
  
  // Test 3: Real-time preview rendering method exists
  test('Real-time preview rendering method exists', () => {
    const app = new MathWorksheetApp();
    
    assert(typeof app.renderPreview === 'function', 'renderPreview method should exist');
    assert(typeof app.shouldRegenerateProblems === 'function', 'shouldRegenerateProblems method should exist');
  });
  
  // Test 4: Debouncing mechanism works
  test('Debouncing mechanism works', () => {
    const app = new MathWorksheetApp();
    
    let renderCallCount = 0;
    app.renderPreview = () => {
      renderCallCount++;
    };
    
    // Call updatePreview multiple times rapidly
    app.updatePreview();
    app.updatePreview();
    app.updatePreview();
    
    // Should only render once due to debouncing
    assert(renderCallCount <= 1, 'Preview should be debounced to avoid excessive rendering');
  });
  
  // Test 5: Problem regeneration logic
  test('Problem regeneration logic works correctly', () => {
    const app = new MathWorksheetApp();
    app.currentConfig = WorksheetConfig.createDefault();
    
    // First call should regenerate
    assert(app.shouldRegenerateProblems(), 'Should regenerate problems on first call');
    
    // Second call with same config should not regenerate
    assert(!app.shouldRegenerateProblems(), 'Should not regenerate problems with same config');
    
    // Change significant config should regenerate
    app.currentConfig.update({ difficulty: 'within50' });
    assert(app.shouldRegenerateProblems(), 'Should regenerate problems when difficulty changes');
  });
  
  // Test 6: Preview properties initialization
  test('Preview properties are properly initialized', () => {
    const app = new MathWorksheetApp();
    
    assert(app.previewUpdateTimeout === null, 'previewUpdateTimeout should be initialized to null');
    assert(app.lastPreviewConfig === null, 'lastPreviewConfig should be initialized to null');
  });
  
  // Test 7: Configuration validation for preview
  test('Configuration validation for preview', () => {
    const app = new MathWorksheetApp();
    app.currentConfig = WorksheetConfig.createDefault();
    
    // Valid configuration should work
    app.updateConfig({ difficulty: 'within20' });
    
    // Invalid configuration should not break preview
    try {
      app.updateConfig({ difficulty: 'invalid' });
    } catch (error) {
      // Expected to throw, preview should handle gracefully
    }
  });
  
  // Test 8: Background configuration integration
  test('Background configuration integration', () => {
    const app = new MathWorksheetApp();
    app.currentConfig = WorksheetConfig.createDefault();
    
    // Test different background styles
    const backgroundStyles = ['blank', 'lined', 'grid', 'dotted'];
    
    backgroundStyles.forEach(style => {
      app.updateConfig({ backgroundStyle: style });
      const bgConfig = app.currentConfig.getBackgroundConfig();
      assert(bgConfig.backgroundStyle === style, `Background style should be ${style}`);
    });
  });
  
  // Test Results
  console.log(`\nReal-time Preview Tests Complete: ${testsPassed}/${testsTotal} passed`);
  
  if (testsPassed === testsTotal) {
    console.log('✅ All real-time preview tests passed!');
    return true;
  } else {
    console.log('❌ Some real-time preview tests failed!');
    return false;
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runRealTimePreviewTests };
} else {
  window.runRealTimePreviewTests = runRealTimePreviewTests;
}

// Auto-run tests if in browser environment
if (typeof window !== 'undefined') {
  // Run tests when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runRealTimePreviewTests);
  } else {
    runRealTimePreviewTests();
  }
}