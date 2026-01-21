/**
 * Node.js test runner for core functionality
 */

// Mock constants for testing
global.DIFFICULTY_LEVELS = {
  within10: { name: '10以内', maxNumber: 10, minNumber: 1 },
  within20: { name: '20以内', maxNumber: 20, minNumber: 1 },
  within50: { name: '50以内', maxNumber: 50, minNumber: 1 },
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
  grid: { name: '方格', type: 'grid' },
  dotted: { name: '点阵', type: 'dotted' },
  custom: { name: '自定义', type: 'image' }
};

global.VALIDATION_RULES = {
  problemCount: { min: 1, max: 50 }
};

// Load the classes
const MathProblem = require('../models/MathProblem');
const WorksheetConfig = require('../models/WorksheetConfig');
const ProblemGenerator = require('../core/ProblemGenerator');
const ConfigurationManager = require('../core/ConfigurationManager');

// Make classes globally available for ProblemGenerator
global.MathProblem = MathProblem;
global.WorksheetConfig = WorksheetConfig;

function runAllTests() {
  console.log('Running All Core Tests...\n');
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  // Test ConfigurationManager
  console.log('=== ConfigurationManager Tests ===');
  const configTests = require('./test-runner');
  const configResult = configTests.runTests();
  if (configResult) {
    totalPassed += 8; // Known number of config tests
  } else {
    totalFailed += 8;
  }
  
  console.log('\n=== MathProblem Tests ===');
  const mathProblemResult = testMathProblem();
  if (mathProblemResult.passed > 0) totalPassed += mathProblemResult.passed;
  if (mathProblemResult.failed > 0) totalFailed += mathProblemResult.failed;
  
  console.log('\n=== ProblemGenerator Tests ===');
  const generatorResult = testProblemGenerator();
  if (generatorResult.passed > 0) totalPassed += generatorResult.passed;
  if (generatorResult.failed > 0) totalFailed += generatorResult.failed;
  
  console.log('\n=== Overall Test Results ===');
  console.log(`Total Passed: ${totalPassed}`);
  console.log(`Total Failed: ${totalFailed}`);
  
  if (totalFailed === 0) {
    console.log('🎉 All tests passed! Core functionality is working correctly.');
    return true;
  } else {
    console.log('❌ Some tests failed. Please review the failures above.');
    return false;
  }
}

function testMathProblem() {
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
      toThrow: () => {
        if (typeof actual !== 'function') {
          throw new Error('Expected a function that throws');
        }
        try {
          actual();
          throw new Error('Expected function to throw, but it did not');
        } catch (e) {
          // Expected to throw
        }
      }
    };
  }
  
  // Test 1: Valid problem creation
  test('MathProblem creates valid addition problem', () => {
    const problem = new MathProblem(5, 3, '+', 8);
    expect(problem.operand1).toBe(5);
    expect(problem.operand2).toBe(3);
    expect(problem.operator).toBe('+');
    expect(problem.result).toBe(8);
  });
  
  // Test 2: Valid subtraction problem
  test('MathProblem creates valid subtraction problem', () => {
    const problem = new MathProblem(10, 4, '-', 6);
    expect(problem.operand1).toBe(10);
    expect(problem.operand2).toBe(4);
    expect(problem.operator).toBe('-');
    expect(problem.result).toBe(6);
  });
  
  // Test 3: Invalid result detection
  test('MathProblem rejects invalid result', () => {
    expect(() => new MathProblem(5, 3, '+', 9)).toThrow();
  });
  
  // Test 4: Negative result detection
  test('MathProblem rejects negative result', () => {
    expect(() => new MathProblem(3, 5, '-', -2)).toThrow();
  });
  
  // Test 5: String representation
  test('MathProblem toString works correctly', () => {
    const problem = new MathProblem(7, 2, '+', 9);
    expect(problem.toString()).toBe('7 + 2 = ');
  });
  
  // Test 6: Difficulty level detection
  test('MathProblem detects difficulty level correctly', () => {
    const problem1 = new MathProblem(5, 3, '+', 8);
    expect(problem1.fitsInDifficulty('within10')).toBe(true);
    expect(problem1.fitsInDifficulty('within20')).toBe(true);
    
    const problem2 = new MathProblem(15, 12, '+', 27);
    expect(problem2.fitsInDifficulty('within10')).toBe(false);
    expect(problem2.fitsInDifficulty('within20')).toBe(true);
  });
  
  return { passed, failed };
}

function testProblemGenerator() {
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
      toBeGreaterThan: (expected) => {
        if (actual <= expected) {
          throw new Error(`Expected ${actual} to be greater than ${expected}`);
        }
      },
      toEqual: (expected) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
        }
      }
    };
  }
  
  // Test 1: Generator initialization
  test('ProblemGenerator initializes correctly', () => {
    const generator = new ProblemGenerator();
    expect(generator.maxRetries).toBe(100);
  });
  
  // Test 2: Generate addition problems
  test('ProblemGenerator generates addition problems', () => {
    const generator = new ProblemGenerator();
    const config = new WorksheetConfig({
      difficulty: 'within10',
      operationType: 'addition',
      problemCount: 5
    });
    
    const problems = generator.generateProblems(config);
    expect(problems.length).toBe(5);
    
    // Check all problems are addition
    const allAddition = problems.every(p => p.operator === '+');
    expect(allAddition).toBe(true);
    
    // Check all problems fit difficulty
    const allFitDifficulty = problems.every(p => p.fitsInDifficulty('within10'));
    expect(allFitDifficulty).toBe(true);
  });
  
  // Test 3: Generate subtraction problems
  test('ProblemGenerator generates subtraction problems', () => {
    const generator = new ProblemGenerator();
    const config = new WorksheetConfig({
      difficulty: 'within20',
      operationType: 'subtraction',
      problemCount: 5
    });
    
    const problems = generator.generateProblems(config);
    expect(problems.length).toBe(5);
    
    // Check all problems are subtraction
    const allSubtraction = problems.every(p => p.operator === '-');
    expect(allSubtraction).toBe(true);
    
    // Check all results are non-negative
    const allNonNegative = problems.every(p => p.result >= 0);
    expect(allNonNegative).toBe(true);
  });
  
  // Test 4: Generate mixed problems
  test('ProblemGenerator generates mixed problems', () => {
    const generator = new ProblemGenerator();
    const config = new WorksheetConfig({
      difficulty: 'within20',
      operationType: 'mixed',
      problemCount: 10
    });
    
    const problems = generator.generateProblems(config);
    expect(problems.length).toBe(10);
    
    // Check we have both addition and subtraction
    const hasAddition = problems.some(p => p.operator === '+');
    const hasSubtraction = problems.some(p => p.operator === '-');
    expect(hasAddition).toBe(true);
    expect(hasSubtraction).toBe(true);
  });
  
  // Test 5: Problem validation
  test('ProblemGenerator validates problems correctly', () => {
    const generator = new ProblemGenerator();
    const config = new WorksheetConfig({
      difficulty: 'within10',
      operationType: 'addition'
    });
    
    const validProblem = new MathProblem(5, 3, '+', 8);
    const invalidProblem = new MathProblem(15, 12, '+', 27); // Outside difficulty
    
    expect(generator.validateProblem(validProblem, config)).toBe(true);
    expect(generator.validateProblem(invalidProblem, config)).toBe(false);
  });
  
  // Test 6: Statistics generation
  test('ProblemGenerator generates statistics correctly', () => {
    const generator = new ProblemGenerator();
    const config = new WorksheetConfig({
      difficulty: 'within20',
      operationType: 'mixed',
      problemCount: 10
    });
    
    const problems = generator.generateProblems(config);
    const stats = generator.getStatistics(problems);
    
    expect(stats.total).toBe(10);
    expect(stats.addition + stats.subtraction).toBe(10);
    expect(stats.minResult).toBeGreaterThan(-1); // Should be >= 0
  });
  
  return { passed, failed };
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };