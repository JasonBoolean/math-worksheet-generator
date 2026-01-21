/**
 * Simple test runner for ConfigurationManager
 */

// Load required modules
const path = require('path');

// Mock constants for testing
global.DIFFICULTY_LEVELS = {
  within10: { name: '10以内', maxNumber: 10, minNumber: 1 },
  within20: { name: '20以内', maxNumber: 20, minNumber: 1 },
  within100: { name: '100以内', maxNumber: 100, minNumber: 1 }
};

global.OPERATION_TYPES = {
  addition: { name: '加法', symbol: '+' },
  subtraction: { name: '减法', symbol: '-' },
  mixed: { name: '加减混合', symbol: '±' }
};

global.LAYOUT_TYPES = {
  'two-column': { name: '两列', columns: 2, problemsPerPage: 20 },
  'three-column': { name: '三列', columns: 3, problemsPerPage: 30 }
};

global.BACKGROUND_STYLES = {
  blank: { name: '空白', type: 'solid' },
  lined: { name: '横线', type: 'lines' },
  custom: { name: '自定义', type: 'image' }
};

global.VALIDATION_RULES = {
  problemCount: { min: 1, max: 50 }
};

// Load the classes
const WorksheetConfig = require('../models/WorksheetConfig');
const ConfigurationManager = require('../core/ConfigurationManager');

// Simple test functions
function runTests() {
  console.log('Running ConfigurationManager Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  function test(name, testFn) {
    try {
      testFn();
      console.log(`✓ ${name}`);
      passed++;
    } catch (error) {
      console.log(`✗ ${name}: ${error.message}`);
      failed++;
    }
  }
  
  function expect(actual) {
    return {
      toBe: (expected) => {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, got ${actual}`);
        }
      },
      toBeInstanceOf: (constructor) => {
        if (!(actual instanceof constructor)) {
          throw new Error(`Expected instance of ${constructor.name}`);
        }
      },
      toBeNull: () => {
        if (actual !== null) {
          throw new Error(`Expected null, got ${actual}`);
        }
      },
      toEqual: (expected) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
        }
      },
      toHaveLength: (length) => {
        if (actual.length !== length) {
          throw new Error(`Expected length ${length}, got ${actual.length}`);
        }
      }
    };
  }
  
  // Test 1: Constructor
  test('ConfigurationManager constructor initializes correctly', () => {
    const manager = new ConfigurationManager();
    expect(manager.currentConfig).toBeNull();
    expect(manager.configHistory).toEqual([]);
  });
  
  // Test 2: Create default config
  test('createConfig creates valid default configuration', () => {
    const manager = new ConfigurationManager();
    const config = manager.createConfig();
    expect(config).toBeInstanceOf(WorksheetConfig);
    expect(config.difficulty).toBe('within20');
  });
  
  // Test 3: Create config with options
  test('createConfig creates configuration with custom options', () => {
    const manager = new ConfigurationManager();
    const config = manager.createConfig({
      difficulty: 'within10',
      operationType: 'subtraction',
      problemCount: 15
    });
    expect(config.difficulty).toBe('within10');
    expect(config.operationType).toBe('subtraction');
    expect(config.problemCount).toBe(15);
  });
  
  // Test 4: Validate options
  test('validateOptions detects invalid difficulty', () => {
    const manager = new ConfigurationManager();
    const result = manager.validateOptions({ difficulty: 'invalid' });
    expect(result.isValid).toBe(false);
  });
  
  // Test 5: Update configuration
  test('updateConfig updates configuration successfully', () => {
    const manager = new ConfigurationManager();
    const config = manager.createConfig({ difficulty: 'within10' });
    const updated = manager.updateConfig(config, { difficulty: 'within20' });
    expect(updated.difficulty).toBe('within20');
  });
  
  // Test 6: History management
  test('saveToHistory saves configuration to history', () => {
    const manager = new ConfigurationManager();
    const config = manager.createConfig();
    manager.saveToHistory(config);
    expect(manager.configHistory).toHaveLength(1);
  });
  
  // Test 7: Template creation
  test('createFromTemplate creates configuration from template', () => {
    const manager = new ConfigurationManager();
    const config = manager.createFromTemplate('beginner-addition');
    expect(config.difficulty).toBe('within10');
    expect(config.operationType).toBe('addition');
  });
  
  // Test 8: Export/Import
  test('exportConfig and importConfig work correctly', () => {
    const manager = new ConfigurationManager();
    const config = manager.createConfig({ difficulty: 'within10', title: 'Test' });
    const jsonString = manager.exportConfig(config);
    const imported = manager.importConfig(jsonString);
    expect(imported.difficulty).toBe('within10');
    expect(imported.title).toBe('Test');
  });
  
  console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('All tests passed! ✓');
    return true;
  } else {
    console.log('Some tests failed! ✗');
    return false;
  }
}

// Run the tests
if (require.main === module) {
  runTests();
}

module.exports = { runTests };