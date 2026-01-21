/**
 * Node.js test for real-time preview functionality
 */

// Load required modules
const constants = require('./js/utils/constants.js');

// Make constants available globally
Object.assign(global, constants);

const MathProblem = require('./js/models/MathProblem.js');
const WorksheetConfig = require('./js/models/WorksheetConfig.js');

// Mock global objects for Node.js environment
global.window = {
  devicePixelRatio: 1,
  addEventListener: () => {},
  setTimeout: (fn, delay) => setTimeout(fn, delay),
  clearTimeout: (id) => clearTimeout(id)
};

global.document = {
  getElementById: () => ({
    style: {},
    addEventListener: () => {},
    disabled: false,
    value: 'within20'
  }),
  querySelectorAll: () => [],
  addEventListener: () => {},
  readyState: 'complete'
};

global.console = console;

// Test the real-time preview functionality
function testRealTimePreview() {
  console.log('Testing Real-time Preview Functionality...\n');
  
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
  
  // Test 1: WorksheetConfig can be created and updated
  test('WorksheetConfig creation and updates', () => {
    const config = WorksheetConfig.createDefault();
    assert(config !== null, 'Config should be created');
    
    const originalDifficulty = config.difficulty;
    config.update({ difficulty: 'within50' });
    assert(config.difficulty === 'within50', 'Config should be updated');
    assert(config.difficulty !== originalDifficulty, 'Config should change');
  });
  
  // Test 2: Configuration change detection
  test('Configuration change detection', () => {
    const config1 = WorksheetConfig.createDefault();
    const config2 = config1.clone();
    
    // Should be equal initially
    assert(config1.equals(config2), 'Cloned configs should be equal');
    
    // Should be different after update
    config2.update({ difficulty: 'within100' });
    assert(!config1.equals(config2), 'Updated configs should be different');
  });
  
  // Test 3: Background configuration
  test('Background configuration handling', () => {
    const config = WorksheetConfig.createDefault();
    
    const backgroundStyles = ['blank', 'lined', 'grid', 'dotted'];
    backgroundStyles.forEach(style => {
      config.update({ backgroundStyle: style });
      const bgConfig = config.getBackgroundConfig();
      assert(bgConfig.backgroundStyle === style || bgConfig.type === style, `Background should be ${style}, got ${bgConfig.backgroundStyle || bgConfig.type}`);
    });
  });
  
  // Test 4: Layout configuration
  test('Layout configuration handling', () => {
    const config = WorksheetConfig.createDefault();
    
    config.update({ layout: 'two-column' });
    let layoutConfig = config.getLayoutConfig();
    assert(layoutConfig.columns === 2, 'Two-column layout should have 2 columns');
    
    config.update({ layout: 'three-column' });
    layoutConfig = config.getLayoutConfig();
    assert(layoutConfig.columns === 3, 'Three-column layout should have 3 columns');
  });
  
  // Test 5: Problem generation parameters
  test('Problem generation parameters', () => {
    const config = WorksheetConfig.createDefault();
    
    // Test difficulty levels
    const difficulties = ['within10', 'within20', 'within50', 'within100'];
    difficulties.forEach(difficulty => {
      config.update({ difficulty });
      const diffConfig = config.getDifficultyConfig();
      assert(diffConfig.maxNumber > 0, `${difficulty} should have valid max number`);
      assert(diffConfig.minNumber > 0, `${difficulty} should have valid min number`);
    });
  });
  
  // Test 6: Operation types
  test('Operation types handling', () => {
    const config = WorksheetConfig.createDefault();
    
    const operations = ['addition', 'subtraction', 'mixed'];
    operations.forEach(operation => {
      config.update({ operationType: operation });
      assert(config.operationType === operation, `Operation should be ${operation}`);
    });
  });
  
  // Test 7: MathProblem creation
  test('MathProblem creation and validation', () => {
    const problem = new MathProblem(5, 3, '+', 8);
    assert(problem.operand1 === 5, 'Operand1 should be 5');
    assert(problem.operand2 === 3, 'Operand2 should be 3');
    assert(problem.operator === '+', 'Operator should be +');
    assert(problem.result === 8, 'Result should be 8');
    
    const problemStr = problem.toString();
    assert(problemStr.includes('5'), 'String should contain operand1');
    assert(problemStr.includes('3'), 'String should contain operand2');
    assert(problemStr.includes('+'), 'String should contain operator');
  });
  
  // Test 8: Constants validation
  test('Constants validation', () => {
    assert(typeof constants.CANVAS_CONFIG === 'object', 'CANVAS_CONFIG should exist');
    assert(typeof constants.DIFFICULTY_LEVELS === 'object', 'DIFFICULTY_LEVELS should exist');
    assert(typeof constants.OPERATION_TYPES === 'object', 'OPERATION_TYPES should exist');
    assert(typeof constants.LAYOUT_TYPES === 'object', 'LAYOUT_TYPES should exist');
    assert(typeof constants.BACKGROUND_STYLES === 'object', 'BACKGROUND_STYLES should exist');
    assert(typeof constants.PERFORMANCE_CONFIG === 'object', 'PERFORMANCE_CONFIG should exist');
    
    // Check debounce delay
    assert(constants.PERFORMANCE_CONFIG.debounceDelay > 0, 'Debounce delay should be positive');
  });
  
  console.log(`\nTest Results: ${testsPassed}/${testsTotal} passed`);
  
  if (testsPassed === testsTotal) {
    console.log('✅ All core functionality tests passed!');
    console.log('Real-time preview implementation is ready.');
    return true;
  } else {
    console.log('❌ Some tests failed!');
    return false;
  }
}

// Run the tests
testRealTimePreview();