/**
 * End-to-End Integration Test
 * Tests the complete workflow from configuration to export
 * Validates all requirements integration
 */

// Load constants and set up global environment
const constants = require('../utils/constants');
Object.assign(global, constants);

// Load all required modules
const MathProblem = require('../models/MathProblem');
const WorksheetConfig = require('../models/WorksheetConfig');
const ConfigurationManager = require('../core/ConfigurationManager');
const ProblemGenerator = require('../core/ProblemGenerator');
const LayoutEngine = require('../core/LayoutEngine');

// Make MathProblem available globally
global.MathProblem = MathProblem;

function runE2ETests() {
  console.log('Running End-to-End Integration Tests...\n');
  console.log('Testing complete workflow: Configuration → Generation → Layout → Validation\n');
  
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
      toEqual: (expected) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
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
      toBeTruthy: () => {
        if (!actual) {
          throw new Error('Expected value to be truthy');
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
          throw new Error(`Expected ${actual} to be >= ${value}`);
        }
      },
      toBeLessThanOrEqual: (value) => {
        if (actual > value) {
          throw new Error(`Expected ${actual} to be <= ${value}`);
        }
      }
    };
  }
  
  // E2E Test 1: Complete workflow for addition problems
  test('E2E: Complete workflow for addition problems (Req 1.1, 1.2, 5.1, 6.1)', () => {
    const configManager = new ConfigurationManager();
    const generator = new ProblemGenerator();
    const layoutEngine = new LayoutEngine();
    
    // Step 1: Create configuration
    const config = configManager.createConfig({
      difficulty: 'within20',
      operationType: 'addition',
      layout: 'two-column',
      backgroundStyle: 'blank',
      problemCount: 10
    });
    
    expect(config).toBeInstanceOf(WorksheetConfig);
    
    // Step 2: Validate configuration
    const validation = configManager.validateConfig(config);
    expect(validation.isValid).toBe(true);
    
    // Step 3: Generate problems
    const problems = generator.generateProblems(config);
    expect(problems).toHaveLength(10);
    
    // Step 4: Verify all problems meet requirements
    problems.forEach(problem => {
      expect(problem.operator).toBe('+');
      expect(problem.operand1).toBeGreaterThan(0);
      expect(problem.operand1).toBeLessThanOrEqual(20);
      expect(problem.operand2).toBeGreaterThan(0);
      expect(problem.operand2).toBeLessThanOrEqual(20);
      expect(problem.result).toBe(problem.operand1 + problem.operand2);
    });
    
    // Step 5: Create layout
    const layout = layoutEngine.calculateLayout(problems, config);
    expect(layout).toBeDefined();
    expect(layout.problems).toHaveLength(10);
    
    // Step 6: Validate layout
    expect(layoutEngine.validateLayout(layout)).toBe(true);
  });
  
  // E2E Test 2: Complete workflow for subtraction problems
  test('E2E: Complete workflow for subtraction problems (Req 1.2, 6.3, 7.3)', () => {
    const configManager = new ConfigurationManager();
    const generator = new ProblemGenerator();
    const layoutEngine = new LayoutEngine();
    
    const config = configManager.createConfig({
      difficulty: 'within10',
      operationType: 'subtraction',
      layout: 'three-column',
      backgroundStyle: 'lined',
      problemCount: 15
    });
    
    const validation = configManager.validateConfig(config);
    expect(validation.isValid).toBe(true);
    
    const problems = generator.generateProblems(config);
    expect(problems).toHaveLength(15);
    
    // Verify subtraction constraints (Req 7.3)
    problems.forEach(problem => {
      expect(problem.operator).toBe('-');
      expect(problem.operand1).toBeGreaterThanOrEqual(problem.operand2);
      expect(problem.result).toBeGreaterThanOrEqual(0);
      expect(problem.result).toBe(problem.operand1 - problem.operand2);
    });
    
    const layout = layoutEngine.calculateLayout(problems, config);
    expect(layout.layoutConfig.columns).toBe(3);
    expect(layoutEngine.validateLayout(layout)).toBe(true);
  });
  
  // E2E Test 3: Complete workflow for mixed operations
  test('E2E: Complete workflow for mixed operations (Req 6.4, 7.5)', () => {
    const configManager = new ConfigurationManager();
    const generator = new ProblemGenerator();
    const layoutEngine = new LayoutEngine();
    
    const config = configManager.createConfig({
      difficulty: 'within50',
      operationType: 'mixed',
      layout: 'two-column',
      backgroundStyle: 'grid',
      problemCount: 20
    });
    
    const problems = generator.generateProblems(config);
    expect(problems).toHaveLength(20);
    
    // Verify mixed operations (Req 6.4)
    let additionCount = 0;
    let subtractionCount = 0;
    
    problems.forEach(problem => {
      if (problem.operator === '+') {
        additionCount++;
        expect(problem.result).toBe(problem.operand1 + problem.operand2);
      } else if (problem.operator === '-') {
        subtractionCount++;
        expect(problem.operand1).toBeGreaterThanOrEqual(problem.operand2);
        expect(problem.result).toBe(problem.operand1 - problem.operand2);
      }
    });
    
    // Verify reasonable distribution (Req 7.5)
    expect(additionCount).toBeGreaterThan(0);
    expect(subtractionCount).toBeGreaterThan(0);
    
    const layout = layoutEngine.calculateLayout(problems, config);
    expect(layoutEngine.validateLayout(layout)).toBe(true);
  });
  
  // E2E Test 4: Problem uniqueness across workflow
  test('E2E: Problem uniqueness maintained throughout workflow (Req 1.4, 7.2)', () => {
    const generator = new ProblemGenerator();
    const layoutEngine = new LayoutEngine();
    
    const config = new WorksheetConfig({
      difficulty: 'within20',
      operationType: 'addition',
      problemCount: 15
    });
    
    const problems = generator.generateProblems(config);
    
    // Check uniqueness
    const problemStrings = problems.map(p => `${p.operand1}${p.operator}${p.operand2}`);
    const uniqueProblems = new Set(problemStrings);
    
    expect(uniqueProblems.size).toBe(problems.length);
    
    // Verify uniqueness is maintained through layout
    const layout = layoutEngine.calculateLayout(problems, config);
    const layoutProblemStrings = layout.problems.map(p => 
      `${p.problem.operand1}${p.problem.operator}${p.problem.operand2}`
    );
    const uniqueLayoutProblems = new Set(layoutProblemStrings);
    
    expect(uniqueLayoutProblems.size).toBe(layout.problems.length);
  });
  
  // E2E Test 5: Different difficulty levels
  test('E2E: Different difficulty levels work correctly (Req 5.1, 5.2, 5.3)', () => {
    const generator = new ProblemGenerator();
    const difficulties = ['within10', 'within20', 'within50', 'within100'];
    const maxNumbers = { within10: 10, within20: 20, within50: 50, within100: 100 };
    
    difficulties.forEach(difficulty => {
      const config = new WorksheetConfig({
        difficulty,
        operationType: 'addition',
        problemCount: 10
      });
      
      const problems = generator.generateProblems(config);
      const maxNumber = maxNumbers[difficulty];
      
      problems.forEach(problem => {
        expect(problem.operand1).toBeLessThanOrEqual(maxNumber);
        expect(problem.operand2).toBeLessThanOrEqual(maxNumber);
      });
    });
  });
  
  // E2E Test 6: Different layout configurations
  test('E2E: Different layout configurations work correctly (Req 4.1, 4.3, 4.4)', () => {
    const generator = new ProblemGenerator();
    const layoutEngine = new LayoutEngine();
    
    const config = new WorksheetConfig({
      difficulty: 'within20',
      operationType: 'addition',
      problemCount: 12
    });
    
    const problems = generator.generateProblems(config);
    
    // Test two-column layout
    const twoColumnConfig = new WorksheetConfig({ ...config, layout: 'two-column' });
    const twoColumnLayout = layoutEngine.calculateLayout(problems, twoColumnConfig);
    expect(twoColumnLayout.layoutConfig.columns).toBe(2);
    expect(layoutEngine.validateLayout(twoColumnLayout)).toBe(true);
    
    // Test three-column layout
    const threeColumnConfig = new WorksheetConfig({ ...config, layout: 'three-column' });
    const threeColumnLayout = layoutEngine.calculateLayout(problems, threeColumnConfig);
    expect(threeColumnLayout.layoutConfig.columns).toBe(3);
    expect(layoutEngine.validateLayout(threeColumnLayout)).toBe(true);
    
    // Verify problems remain the same (Req 4.4)
    expect(twoColumnLayout.problems.length).toBe(threeColumnLayout.problems.length);
  });
  
  // E2E Test 7: Configuration persistence and history
  test('E2E: Configuration persistence and history (Req 8.7, 10.3)', () => {
    const configManager = new ConfigurationManager();
    
    const config1 = configManager.createConfig({
      difficulty: 'within10',
      operationType: 'addition',
      problemCount: 10
    });
    
    const config2 = configManager.createConfig({
      difficulty: 'within20',
      operationType: 'subtraction',
      problemCount: 15
    });
    
    configManager.saveToHistory(config1);
    configManager.saveToHistory(config2);
    
    const history = configManager.getHistory();
    expect(history.length).toBeGreaterThanOrEqual(2);
    
    // Verify export/import
    const exported = configManager.exportConfig(config1);
    const imported = configManager.importConfig(exported);
    
    expect(imported.difficulty).toBe(config1.difficulty);
    expect(imported.operationType).toBe(config1.operationType);
    expect(imported.problemCount).toBe(config1.problemCount);
  });
  
  // E2E Test 8: Error handling throughout workflow
  test('E2E: Error handling throughout workflow (Req 1.5, 10.1, 10.4, 10.5)', () => {
    const configManager = new ConfigurationManager();
    const generator = new ProblemGenerator();
    
    // Test invalid configuration - create it first, then validate
    let invalidConfig;
    try {
      invalidConfig = new WorksheetConfig({
        difficulty: 'within20',
        operationType: 'addition',
        problemCount: -5 // Invalid
      });
    } catch (error) {
      // If constructor throws, that's also valid error handling
      invalidConfig = new WorksheetConfig({
        difficulty: 'within20',
        operationType: 'addition',
        problemCount: 10
      });
      invalidConfig.problemCount = -5; // Set invalid value after construction
    }
    
    const validation = configManager.validateConfig(invalidConfig);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
    
    // Test with valid configuration after error
    const validConfig = configManager.createConfig({
      difficulty: 'within20',
      operationType: 'addition',
      problemCount: 10
    });
    
    const validValidation = configManager.validateConfig(validConfig);
    expect(validValidation.isValid).toBe(true);
    
    const problems = generator.generateProblems(validConfig);
    expect(problems).toHaveLength(10);
  });
  
  // E2E Test 9: Layout stability with configuration changes
  test('E2E: Layout stability with configuration changes (Req 4.4, 2.6)', () => {
    const generator = new ProblemGenerator();
    const layoutEngine = new LayoutEngine();
    
    const config = new WorksheetConfig({
      difficulty: 'within20',
      operationType: 'addition',
      problemCount: 10
    });
    
    const problems = generator.generateProblems(config);
    
    // Create layout with different background styles
    const blankConfig = new WorksheetConfig({ ...config, backgroundStyle: 'blank' });
    const linedConfig = new WorksheetConfig({ ...config, backgroundStyle: 'lined' });
    const gridConfig = new WorksheetConfig({ ...config, backgroundStyle: 'grid' });
    
    const blankLayout = layoutEngine.calculateLayout(problems, blankConfig);
    const linedLayout = layoutEngine.calculateLayout(problems, linedConfig);
    const gridLayout = layoutEngine.calculateLayout(problems, gridConfig);
    
    // Verify problems remain the same
    expect(blankLayout.problems.length).toBe(problems.length);
    expect(linedLayout.problems.length).toBe(problems.length);
    expect(gridLayout.problems.length).toBe(problems.length);
    
    // Verify all layouts are valid
    expect(layoutEngine.validateLayout(blankLayout)).toBe(true);
    expect(layoutEngine.validateLayout(linedLayout)).toBe(true);
    expect(layoutEngine.validateLayout(gridLayout)).toBe(true);
  });
  
  // E2E Test 10: Large-scale workflow test
  test('E2E: Large-scale workflow with maximum problems (Performance)', () => {
    const configManager = new ConfigurationManager();
    const generator = new ProblemGenerator();
    const layoutEngine = new LayoutEngine();
    
    const config = configManager.createConfig({
      difficulty: 'within100',
      operationType: 'mixed',
      layout: 'three-column',
      backgroundStyle: 'grid',
      problemCount: 50 // Maximum allowed
    });
    
    const validation = configManager.validateConfig(config);
    expect(validation.isValid).toBe(true);
    
    const startTime = Date.now();
    
    const problems = generator.generateProblems(config);
    expect(problems).toHaveLength(50);
    
    const layout = layoutEngine.calculateLayout(problems, config);
    expect(layout.problems).toHaveLength(50);
    expect(layoutEngine.validateLayout(layout)).toBe(true);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete within reasonable time (1 second for 50 problems)
    if (duration > 1000) {
      console.warn(`  ⚠ Large-scale workflow took ${duration}ms`);
    }
    
    // Verify no overlaps in layout
    expect(layoutEngine.hasOverlaps(layout.problems)).toBe(false);
  });
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`E2E Integration Test Results: ${passed} passed, ${failed} failed`);
  console.log(`${'='.repeat(60)}\n`);
  
  if (failed === 0) {
    console.log('✓ All end-to-end integration tests passed!');
    console.log('✓ Complete workflow validated from configuration to layout');
    console.log('✓ All requirements integration verified');
    return true;
  } else {
    console.log('✗ Some end-to-end integration tests failed!');
    return false;
  }
}

// Run the tests
if (require.main === module) {
  const success = runE2ETests();
  process.exit(success ? 0 : 1);
}

module.exports = { runE2ETests };
