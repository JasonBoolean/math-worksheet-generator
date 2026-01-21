/**
 * LayoutEngine Tests
 * Tests for the layout calculation engine
 */

// Import required classes
if (typeof require !== 'undefined') {
  // Node.js environment
  const LayoutEngine = require('../core/LayoutEngine');
  const MathProblem = require('../models/MathProblem');
  const WorksheetConfig = require('../models/WorksheetConfig');
  const constants = require('../utils/constants');
  
  // Make constants available globally for the tests
  Object.assign(global, constants);
}

describe('LayoutEngine', () => {
  let layoutEngine;
  let sampleProblems;
  let sampleConfig;
  
  beforeEach(() => {
    layoutEngine = new LayoutEngine();
    
    // Create sample problems
    sampleProblems = [
      new MathProblem(5, 3, '+', 8),
      new MathProblem(7, 2, '+', 9),
      new MathProblem(10, 4, '-', 6),
      new MathProblem(8, 3, '+', 11),
      new MathProblem(9, 5, '-', 4),
      new MathProblem(6, 4, '+', 10)
    ];
    
    // Create sample configuration
    sampleConfig = new WorksheetConfig({
      difficulty: 'within20',
      operationType: 'mixed',
      layout: 'two-column',
      backgroundStyle: 'blank'
    });
  });
  
  describe('Constructor', () => {
    test('should create LayoutEngine instance', () => {
      expect(layoutEngine).toBeInstanceOf(LayoutEngine);
      expect(layoutEngine.currentLayout).toBeNull();
      expect(layoutEngine.debugMode).toBe(false);
    });
  });
  
  describe('calculateLayout', () => {
    test('should calculate layout for valid problems and config', () => {
      const layout = layoutEngine.calculateLayout(sampleProblems, sampleConfig);
      
      expect(layout).toBeDefined();
      expect(layout.problems).toHaveLength(sampleProblems.length);
      expect(layout.pageSize).toBeDefined();
      expect(layout.margins).toBeDefined();
      expect(layout.layoutConfig).toBeDefined();
      expect(layout.availableSpace).toBeDefined();
      expect(layout.metadata).toBeDefined();
    });
    
    test('should throw error for empty problems array', () => {
      expect(() => {
        layoutEngine.calculateLayout([], sampleConfig);
      }).toThrow('No problems provided for layout calculation');
    });
    
    test('should throw error for null problems', () => {
      expect(() => {
        layoutEngine.calculateLayout(null, sampleConfig);
      }).toThrow('No problems provided for layout calculation');
    });
    
    test('should throw error for missing config', () => {
      expect(() => {
        layoutEngine.calculateLayout(sampleProblems, null);
      }).toThrow('Configuration is required for layout calculation');
    });
    
    test('should handle different column layouts', () => {
      const twoColumnConfig = new WorksheetConfig({ layout: 'two-column' });
      const threeColumnConfig = new WorksheetConfig({ layout: 'three-column' });
      
      const twoColumnLayout = layoutEngine.calculateLayout(sampleProblems, twoColumnConfig);
      const threeColumnLayout = layoutEngine.calculateLayout(sampleProblems, threeColumnConfig);
      
      expect(twoColumnLayout.layoutConfig.columns).toBe(2);
      expect(threeColumnLayout.layoutConfig.columns).toBe(3);
    });
  });
  
  describe('Problem Positioning', () => {
    test('should position problems in correct columns', () => {
      const layout = layoutEngine.calculateLayout(sampleProblems, sampleConfig);
      
      layout.problems.forEach((problemPos, index) => {
        const expectedColumn = index % sampleConfig.getLayoutConfig().columns;
        expect(problemPos.metadata.column).toBe(expectedColumn);
      });
    });
    
    test('should position problems in correct rows', () => {
      const layout = layoutEngine.calculateLayout(sampleProblems, sampleConfig);
      const columns = sampleConfig.getLayoutConfig().columns;
      
      layout.problems.forEach((problemPos, index) => {
        const expectedRow = Math.floor(index / columns);
        expect(problemPos.metadata.row).toBe(expectedRow);
      });
    });
    
    test('should assign valid positions to all problems', () => {
      const layout = layoutEngine.calculateLayout(sampleProblems, sampleConfig);
      
      layout.problems.forEach(problemPos => {
        expect(problemPos.position.x).toBeGreaterThanOrEqual(0);
        expect(problemPos.position.y).toBeGreaterThanOrEqual(0);
        expect(problemPos.position.width).toBeGreaterThan(0);
        expect(problemPos.position.height).toBeGreaterThan(0);
      });
    });
    
    test('should maintain proper spacing between columns', () => {
      const layout = layoutEngine.calculateLayout(sampleProblems, sampleConfig);
      const columns = layout.layoutConfig.columns;
      
      if (layout.problems.length >= columns) {
        // Check spacing between first two problems in the same row
        const problem1 = layout.problems[0];
        const problem2 = layout.problems[1];
        
        const spacing = problem2.position.x - (problem1.position.x + problem1.position.width);
        expect(spacing).toBeGreaterThanOrEqual(0);
      }
    });
  });
  
  describe('optimizeSpacing', () => {
    test('should optimize layout spacing', () => {
      const layout = layoutEngine.calculateLayout(sampleProblems, sampleConfig);
      const originalLayout = JSON.parse(JSON.stringify(layout));
      
      const optimizedLayout = layoutEngine.optimizeSpacing(layout);
      
      expect(optimizedLayout).toBeDefined();
      expect(optimizedLayout.problems).toHaveLength(originalLayout.problems.length);
    });
    
    test('should maintain problem order after optimization', () => {
      const layout = layoutEngine.calculateLayout(sampleProblems, sampleConfig);
      const optimizedLayout = layoutEngine.optimizeSpacing(layout);
      
      optimizedLayout.problems.forEach((problemPos, index) => {
        expect(problemPos.problem.id).toBe(sampleProblems[index].id);
      });
    });
  });
  
  describe('validateLayout', () => {
    test('should validate correct layout', () => {
      const layout = layoutEngine.calculateLayout(sampleProblems, sampleConfig);
      expect(layoutEngine.validateLayout(layout)).toBe(true);
    });
    
    test('should reject null layout', () => {
      expect(layoutEngine.validateLayout(null)).toBe(false);
    });
    
    test('should reject layout without problems', () => {
      const invalidLayout = { pageSize: {}, margins: {} };
      expect(layoutEngine.validateLayout(invalidLayout)).toBe(false);
    });
    
    test('should reject layout with invalid problem positions', () => {
      const layout = layoutEngine.calculateLayout(sampleProblems, sampleConfig);
      
      // Corrupt a position
      layout.problems[0].position.x = NaN;
      
      expect(layoutEngine.validateLayout(layout)).toBe(false);
    });
  });
  
  describe('Layout Statistics', () => {
    test('should calculate layout statistics', () => {
      const layout = layoutEngine.calculateLayout(sampleProblems, sampleConfig);
      const stats = layoutEngine.getLayoutStatistics(layout);
      
      expect(stats).toBeDefined();
      expect(stats.totalProblems).toBe(sampleProblems.length);
      expect(stats.columns).toBe(sampleConfig.getLayoutConfig().columns);
      expect(stats.rows).toBeGreaterThan(0);
      expect(stats.averageSpacing).toBeDefined();
      expect(stats.utilization).toBeDefined();
      expect(stats.bounds).toBeDefined();
    });
    
    test('should return null for invalid layout', () => {
      const stats = layoutEngine.getLayoutStatistics(null);
      expect(stats).toBeNull();
    });
  });
  
  describe('Overlap Detection', () => {
    test('should detect no overlaps in valid layout', () => {
      const layout = layoutEngine.calculateLayout(sampleProblems, sampleConfig);
      expect(layoutEngine.hasOverlaps(layout.problems)).toBe(false);
    });
    
    test('should detect overlaps when problems overlap', () => {
      const layout = layoutEngine.calculateLayout(sampleProblems, sampleConfig);
      
      // Force an overlap
      layout.problems[1].position.x = layout.problems[0].position.x;
      layout.problems[1].position.y = layout.problems[0].position.y;
      
      expect(layoutEngine.hasOverlaps(layout.problems)).toBe(true);
    });
  });
  
  describe('Bounds Checking', () => {
    test('should ensure problems fit within page bounds', () => {
      const layout = layoutEngine.calculateLayout(sampleProblems, sampleConfig);
      expect(layoutEngine.problemsFitInBounds(layout.problems, layout)).toBe(true);
    });
    
    test('should detect problems outside bounds', () => {
      const layout = layoutEngine.calculateLayout(sampleProblems, sampleConfig);
      
      // Move a problem outside bounds
      layout.problems[0].position.x = layout.pageSize.width + 100;
      
      expect(layoutEngine.problemsFitInBounds(layout.problems, layout)).toBe(false);
    });
  });
  
  describe('Configuration Handling', () => {
    test('should handle different difficulty levels', () => {
      const easyConfig = new WorksheetConfig({ difficulty: 'within10' });
      const hardConfig = new WorksheetConfig({ difficulty: 'within100' });
      
      const easyLayout = layoutEngine.calculateLayout(sampleProblems, easyConfig);
      const hardLayout = layoutEngine.calculateLayout(sampleProblems, hardConfig);
      
      expect(easyLayout).toBeDefined();
      expect(hardLayout).toBeDefined();
    });
    
    test('should handle different operation types', () => {
      const additionConfig = new WorksheetConfig({ operationType: 'addition' });
      const subtractionConfig = new WorksheetConfig({ operationType: 'subtraction' });
      
      const additionLayout = layoutEngine.calculateLayout(sampleProblems, additionConfig);
      const subtractionLayout = layoutEngine.calculateLayout(sampleProblems, subtractionConfig);
      
      expect(additionLayout).toBeDefined();
      expect(subtractionLayout).toBeDefined();
    });
  });
  
  describe('Debug Mode', () => {
    test('should enable and disable debug mode', () => {
      expect(layoutEngine.debugMode).toBe(false);
      
      layoutEngine.setDebugMode(true);
      expect(layoutEngine.debugMode).toBe(true);
      
      layoutEngine.setDebugMode(false);
      expect(layoutEngine.debugMode).toBe(false);
    });
  });
  
  describe('Current Layout Management', () => {
    test('should store and retrieve current layout', () => {
      expect(layoutEngine.getCurrentLayout()).toBeNull();
      
      const layout = layoutEngine.calculateLayout(sampleProblems, sampleConfig);
      expect(layoutEngine.getCurrentLayout()).toBe(layout);
    });
    
    test('should clear current layout', () => {
      layoutEngine.calculateLayout(sampleProblems, sampleConfig);
      expect(layoutEngine.getCurrentLayout()).not.toBeNull();
      
      layoutEngine.clearLayout();
      expect(layoutEngine.getCurrentLayout()).toBeNull();
    });
  });
  
  describe('Edge Cases', () => {
    test('should handle single problem', () => {
      const singleProblem = [new MathProblem(5, 3, '+', 8)];
      const layout = layoutEngine.calculateLayout(singleProblem, sampleConfig);
      
      expect(layout.problems).toHaveLength(1);
      expect(layout.problems[0].metadata.row).toBe(0);
      expect(layout.problems[0].metadata.column).toBe(0);
    });
    
    test('should handle many problems', () => {
      const manyProblems = [];
      for (let i = 0; i < 50; i++) {
        manyProblems.push(new MathProblem(i % 10 + 1, (i + 1) % 10 + 1, '+', (i % 10 + 1) + ((i + 1) % 10 + 1)));
      }
      
      const layout = layoutEngine.calculateLayout(manyProblems, sampleConfig);
      
      expect(layout.problems).toHaveLength(50);
      expect(layoutEngine.validateLayout(layout)).toBe(true);
    });
    
    test('should handle three-column layout with few problems', () => {
      const threeColumnConfig = new WorksheetConfig({ layout: 'three-column' });
      const fewProblems = sampleProblems.slice(0, 2);
      
      const layout = layoutEngine.calculateLayout(fewProblems, threeColumnConfig);
      
      expect(layout.problems).toHaveLength(2);
      expect(layout.problems[0].metadata.column).toBe(0);
      expect(layout.problems[1].metadata.column).toBe(1);
    });
  });
  
  describe('Performance', () => {
    test('should calculate layout in reasonable time', () => {
      const startTime = Date.now();
      
      const layout = layoutEngine.calculateLayout(sampleProblems, sampleConfig);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 100ms for small problem sets
      expect(duration).toBeLessThan(100);
      expect(layout).toBeDefined();
    });
  });
});

// Test helper functions
function createTestProblems(count) {
  const problems = [];
  for (let i = 0; i < count; i++) {
    const operand1 = Math.floor(Math.random() * 10) + 1;
    const operand2 = Math.floor(Math.random() * 10) + 1;
    const operator = Math.random() > 0.5 ? '+' : '-';
    const result = operator === '+' ? operand1 + operand2 : Math.max(operand1 - operand2, 0);
    
    problems.push(new MathProblem(operand1, operand2, operator, result));
  }
  return problems;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createTestProblems
  };
}