/**
 * Integration test for LayoutEngine with other components
 */

// Load required modules and set up constants
const constants = require('../utils/constants');
Object.assign(global, constants);

const MathProblem = require('../models/MathProblem');
const WorksheetConfig = require('../models/WorksheetConfig');
const LayoutEngine = require('../core/LayoutEngine');
const ProblemGenerator = require('../core/ProblemGenerator');

// Make MathProblem available globally for ProblemGenerator
global.MathProblem = MathProblem;

function runIntegrationTests() {
  console.log('Running LayoutEngine Integration Tests...\n');
  
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
  
  // Test 1: Integration with ProblemGenerator
  test('LayoutEngine works with ProblemGenerator', () => {
    const generator = new ProblemGenerator();
    const layoutEngine = new LayoutEngine();
    const config = new WorksheetConfig({
      difficulty: 'within20',
      operationType: 'addition',
      layout: 'two-column',
      problemCount: 10
    });
    
    const problems = generator.generateProblems(config);
    const layout = layoutEngine.calculateLayout(problems, config);
    
    expect(layout).toBeDefined();
    expect(layout.problems).toHaveLength(10);
    expect(layout.layoutConfig.columns).toBe(2);
  });
  
  // Test 2: Different layout configurations
  test('LayoutEngine handles different layout configurations', () => {
    const layoutEngine = new LayoutEngine();
    const problems = [
      new MathProblem(5, 3, '+', 8),
      new MathProblem(7, 2, '+', 9),
      new MathProblem(10, 4, '-', 6),
      new MathProblem(8, 3, '+', 11),
      new MathProblem(9, 5, '-', 4),
      new MathProblem(6, 4, '+', 10)
    ];
    
    // Test two-column layout
    const twoColumnConfig = new WorksheetConfig({ layout: 'two-column' });
    const twoColumnLayout = layoutEngine.calculateLayout(problems, twoColumnConfig);
    expect(twoColumnLayout.layoutConfig.columns).toBe(2);
    
    // Test three-column layout
    const threeColumnConfig = new WorksheetConfig({ layout: 'three-column' });
    const threeColumnLayout = layoutEngine.calculateLayout(problems, threeColumnConfig);
    expect(threeColumnLayout.layoutConfig.columns).toBe(3);
  });
  
  // Test 3: Layout with different problem counts
  test('LayoutEngine handles different problem counts', () => {
    const layoutEngine = new LayoutEngine();
    const config = new WorksheetConfig({ layout: 'two-column' });
    
    // Test with few problems
    const fewProblems = [
      new MathProblem(5, 3, '+', 8),
      new MathProblem(7, 2, '+', 9)
    ];
    const fewLayout = layoutEngine.calculateLayout(fewProblems, config);
    expect(fewLayout.problems).toHaveLength(2);
    
    // Test with many problems
    const manyProblems = [];
    for (let i = 0; i < 20; i++) {
      manyProblems.push(new MathProblem(i % 10 + 1, (i + 1) % 10 + 1, '+', (i % 10 + 1) + ((i + 1) % 10 + 1)));
    }
    const manyLayout = layoutEngine.calculateLayout(manyProblems, config);
    expect(manyLayout.problems).toHaveLength(20);
  });
  
  // Test 4: Layout validation with real data
  test('LayoutEngine validates layouts correctly', () => {
    const layoutEngine = new LayoutEngine();
    const generator = new ProblemGenerator();
    const config = new WorksheetConfig({
      difficulty: 'within50',
      operationType: 'mixed',
      layout: 'three-column',
      problemCount: 15
    });
    
    const problems = generator.generateProblems(config);
    const layout = layoutEngine.calculateLayout(problems, config);
    
    expect(layoutEngine.validateLayout(layout)).toBe(true);
    
    // Check that all problems fit within bounds
    expect(layoutEngine.problemsFitInBounds(layout.problems, layout)).toBe(true);
    
    // Check for no overlaps
    expect(layoutEngine.hasOverlaps(layout.problems)).toBe(false);
  });
  
  // Test 5: Layout statistics calculation
  test('LayoutEngine calculates meaningful statistics', () => {
    const layoutEngine = new LayoutEngine();
    const problems = [];
    for (let i = 0; i < 12; i++) {
      problems.push(new MathProblem(i % 10 + 1, (i + 1) % 10 + 1, '+', (i % 10 + 1) + ((i + 1) % 10 + 1)));
    }
    
    const config = new WorksheetConfig({ layout: 'three-column' });
    const layout = layoutEngine.calculateLayout(problems, config);
    const stats = layoutEngine.getLayoutStatistics(layout);
    
    expect(stats).toBeDefined();
    expect(stats.totalProblems).toBe(12);
    expect(stats.columns).toBe(3);
    expect(stats.rows).toBe(4); // 12 problems / 3 columns = 4 rows
    expect(stats.bounds).toBeDefined();
    expect(stats.utilization).toBeDefined();
  });
  
  // Test 6: Layout optimization
  test('LayoutEngine optimizes spacing correctly', () => {
    const layoutEngine = new LayoutEngine();
    const problems = [];
    for (let i = 0; i < 8; i++) {
      problems.push(new MathProblem(i % 10 + 1, (i + 1) % 10 + 1, '+', (i % 10 + 1) + ((i + 1) % 10 + 1)));
    }
    
    const config = new WorksheetConfig({ layout: 'two-column' });
    const layout = layoutEngine.calculateLayout(problems, config);
    
    // The layout should already be optimized by calculateLayout
    expect(layout).toBeDefined();
    expect(layout.problems).toHaveLength(8);
    
    // Manually optimize again to test the method
    const optimizedLayout = layoutEngine.optimizeSpacing(layout);
    expect(optimizedLayout.problems).toHaveLength(8);
  });
  
  // Test 7: Edge case - single problem
  test('LayoutEngine handles single problem correctly', () => {
    const layoutEngine = new LayoutEngine();
    const singleProblem = [new MathProblem(5, 3, '+', 8)];
    const config = new WorksheetConfig({ layout: 'three-column' });
    
    const layout = layoutEngine.calculateLayout(singleProblem, config);
    
    expect(layout.problems).toHaveLength(1);
    expect(layout.problems[0].metadata.row).toBe(0);
    expect(layout.problems[0].metadata.column).toBe(0);
    expect(layoutEngine.validateLayout(layout)).toBe(true);
  });
  
  // Test 8: Layout consistency
  test('LayoutEngine produces consistent layouts for same input', () => {
    const layoutEngine = new LayoutEngine();
    const problems = [
      new MathProblem(5, 3, '+', 8),
      new MathProblem(7, 2, '+', 9),
      new MathProblem(10, 4, '-', 6),
      new MathProblem(8, 3, '+', 11)
    ];
    const config = new WorksheetConfig({ layout: 'two-column' });
    
    const layout1 = layoutEngine.calculateLayout(problems, config);
    const layout2 = layoutEngine.calculateLayout(problems, config);
    
    // Layouts should be identical for same input
    expect(layout1.problems).toHaveLength(layout2.problems.length);
    
    for (let i = 0; i < layout1.problems.length; i++) {
      const pos1 = layout1.problems[i].position;
      const pos2 = layout2.problems[i].position;
      
      expect(pos1.x).toBe(pos2.x);
      expect(pos1.y).toBe(pos2.y);
      expect(pos1.width).toBe(pos2.width);
      expect(pos1.height).toBe(pos2.height);
    }
  });
  
  // Test 9: Memory management
  test('LayoutEngine manages current layout correctly', () => {
    const layoutEngine = new LayoutEngine();
    const problems = [new MathProblem(5, 3, '+', 8)];
    const config = new WorksheetConfig();
    
    // Initially no current layout
    expect(layoutEngine.getCurrentLayout()).toBe(null);
    
    // After calculation, current layout should be set
    const layout = layoutEngine.calculateLayout(problems, config);
    expect(layoutEngine.getCurrentLayout()).toBe(layout);
    
    // After clearing, should be null again
    layoutEngine.clearLayout();
    expect(layoutEngine.getCurrentLayout()).toBe(null);
  });
  
  // Test 10: Performance with larger datasets
  test('LayoutEngine performs well with larger datasets', () => {
    const layoutEngine = new LayoutEngine();
    const problems = [];
    
    // Create 30 problems
    for (let i = 0; i < 30; i++) {
      const operand1 = Math.floor(Math.random() * 20) + 1;
      const operand2 = Math.floor(Math.random() * 20) + 1;
      const operator = Math.random() > 0.5 ? '+' : '-';
      let result;
      
      if (operator === '+') {
        result = operand1 + operand2;
      } else {
        // For subtraction, ensure result is non-negative
        if (operand1 >= operand2) {
          result = operand1 - operand2;
        } else {
          // Swap operands to ensure positive result
          result = operand2 - operand1;
          problems.push(new MathProblem(operand2, operand1, operator, result));
          continue;
        }
      }
      
      problems.push(new MathProblem(operand1, operand2, operator, result));
    }
    
    const config = new WorksheetConfig({ layout: 'three-column' });
    
    const startTime = Date.now();
    const layout = layoutEngine.calculateLayout(problems, config);
    const endTime = Date.now();
    
    const duration = endTime - startTime;
    
    expect(layout.problems).toHaveLength(30);
    expect(layoutEngine.validateLayout(layout)).toBe(true);
    
    // Should complete within reasonable time (500ms for 30 problems)
    if (duration > 500) {
      console.warn(`Layout calculation took ${duration}ms for 30 problems`);
    }
  });
  
  console.log(`\nIntegration Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('All LayoutEngine integration tests passed! ✓');
    return true;
  } else {
    console.log('Some LayoutEngine integration tests failed! ✗');
    return false;
  }
}

// Run the tests
if (require.main === module) {
  runIntegrationTests();
}

module.exports = { runIntegrationTests };