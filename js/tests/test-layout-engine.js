/**
 * Simple test for LayoutEngine functionality
 */

// Load required modules and set up constants
const constants = require('../utils/constants');
Object.assign(global, constants);

const LayoutEngine = require('../core/LayoutEngine');
const MathProblem = require('../models/MathProblem');
const WorksheetConfig = require('../models/WorksheetConfig');

function runLayoutEngineTests() {
  console.log('Running LayoutEngine Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  function test(name, testFn) {
    try {
      testFn();
      console.log(`✓ ${name}`);
      passed++;
    } catch (error) {
      console.log(`✗ ${name}: ${error.message}`);
      console.log(error.stack);
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
      toBeDefined: () => {
        if (actual === undefined) {
          throw new Error('Expected value to be defined');
        }
      },
      toHaveLength: (length) => {
        if (actual.length !== length) {
          throw new Error(`Expected length ${length}, got ${actual.length}`);
        }
      },
      toBeGreaterThan: (value) => {
        if (actual <= value) {
          throw new Error(`Expected ${actual} to be greater than ${value}`);
        }
      },
      toBeGreaterThanOrEqual: (value) => {
        if (actual < value) {
          throw new Error(`Expected ${actual} to be greater than or equal to ${value}`);
        }
      }
    };
  }
  
  // Create test data
  const sampleProblems = [
    new MathProblem(5, 3, '+', 8),
    new MathProblem(7, 2, '+', 9),
    new MathProblem(10, 4, '-', 6),
    new MathProblem(8, 3, '+', 11),
    new MathProblem(9, 5, '-', 4),
    new MathProblem(6, 4, '+', 10)
  ];
  
  const sampleConfig = new WorksheetConfig({
    difficulty: 'within20',
    operationType: 'mixed',
    layout: 'two-column',
    backgroundStyle: 'blank'
  });
  
  // Test 1: Constructor
  test('LayoutEngine constructor initializes correctly', () => {
    const layoutEngine = new LayoutEngine();
    expect(layoutEngine).toBeInstanceOf(LayoutEngine);
    expect(layoutEngine.currentLayout).toBeNull();
  });
  
  // Test 2: Basic layout calculation
  test('calculateLayout works with valid input', () => {
    const layoutEngine = new LayoutEngine();
    const layout = layoutEngine.calculateLayout(sampleProblems, sampleConfig);
    
    expect(layout).toBeDefined();
    expect(layout.problems).toHaveLength(sampleProblems.length);
    expect(layout.pageSize).toBeDefined();
    expect(layout.margins).toBeDefined();
  });
  
  // Test 3: Error handling
  test('calculateLayout throws error for empty problems', () => {
    const layoutEngine = new LayoutEngine();
    try {
      layoutEngine.calculateLayout([], sampleConfig);
      throw new Error('Should have thrown an error');
    } catch (error) {
      if (!error.message.includes('No problems provided')) {
        throw error;
      }
    }
  });
  
  // Test 4: Problem positioning
  test('problems are positioned correctly', () => {
    const layoutEngine = new LayoutEngine();
    const layout = layoutEngine.calculateLayout(sampleProblems, sampleConfig);
    
    layout.problems.forEach((problemPos, index) => {
      expect(problemPos.position.x).toBeGreaterThanOrEqual(0);
      expect(problemPos.position.y).toBeGreaterThanOrEqual(0);
      expect(problemPos.position.width).toBeGreaterThan(0);
      expect(problemPos.position.height).toBeGreaterThan(0);
      expect(problemPos.metadata.index).toBe(index);
    });
  });
  
  // Test 5: Layout validation
  test('validateLayout works correctly', () => {
    const layoutEngine = new LayoutEngine();
    const layout = layoutEngine.calculateLayout(sampleProblems, sampleConfig);
    
    const isValid = layoutEngine.validateLayout(layout);
    expect(isValid).toBe(true);
  });
  
  // Test 6: Column layout
  test('problems are arranged in correct columns', () => {
    const layoutEngine = new LayoutEngine();
    const layout = layoutEngine.calculateLayout(sampleProblems, sampleConfig);
    const columns = sampleConfig.getLayoutConfig().columns;
    
    layout.problems.forEach((problemPos, index) => {
      const expectedColumn = index % columns;
      expect(problemPos.metadata.column).toBe(expectedColumn);
    });
  });
  
  // Test 7: Three-column layout
  test('three-column layout works correctly', () => {
    const layoutEngine = new LayoutEngine();
    const threeColumnConfig = new WorksheetConfig({ layout: 'three-column' });
    const layout = layoutEngine.calculateLayout(sampleProblems, threeColumnConfig);
    
    expect(layout.layoutConfig.columns).toBe(3);
    expect(layout.problems).toHaveLength(sampleProblems.length);
  });
  
  // Test 8: Layout statistics
  test('getLayoutStatistics returns valid statistics', () => {
    const layoutEngine = new LayoutEngine();
    const layout = layoutEngine.calculateLayout(sampleProblems, sampleConfig);
    const stats = layoutEngine.getLayoutStatistics(layout);
    
    expect(stats).toBeDefined();
    expect(stats.totalProblems).toBe(sampleProblems.length);
    expect(stats.columns).toBe(sampleConfig.getLayoutConfig().columns);
  });
  
  // Test 9: Debug mode
  test('debug mode can be enabled and disabled', () => {
    const layoutEngine = new LayoutEngine();
    expect(layoutEngine.debugMode).toBe(false);
    
    layoutEngine.setDebugMode(true);
    expect(layoutEngine.debugMode).toBe(true);
    
    layoutEngine.setDebugMode(false);
    expect(layoutEngine.debugMode).toBe(false);
  });
  
  // Test 10: Current layout management
  test('current layout is stored and can be retrieved', () => {
    const layoutEngine = new LayoutEngine();
    expect(layoutEngine.getCurrentLayout()).toBeNull();
    
    const layout = layoutEngine.calculateLayout(sampleProblems, sampleConfig);
    expect(layoutEngine.getCurrentLayout()).toBe(layout);
    
    layoutEngine.clearLayout();
    expect(layoutEngine.getCurrentLayout()).toBeNull();
  });
  
  console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('All LayoutEngine tests passed! ✓');
    return true;
  } else {
    console.log('Some LayoutEngine tests failed! ✗');
    return false;
  }
}

// Run the tests
if (require.main === module) {
  runLayoutEngineTests();
}

module.exports = { runLayoutEngineTests };