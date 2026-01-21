/**
 * LayoutEngine Demo
 * Demonstrates the layout calculation functionality
 */

// This demo can be run in the browser console or in Node.js

function runLayoutDemo() {
  console.log('=== LayoutEngine Demo ===\n');
  
  // Create sample problems
  const problems = [
    new MathProblem(5, 3, '+', 8),
    new MathProblem(12, 7, '-', 5),
    new MathProblem(8, 4, '+', 12),
    new MathProblem(15, 9, '-', 6),
    new MathProblem(6, 7, '+', 13),
    new MathProblem(20, 8, '-', 12),
    new MathProblem(9, 5, '+', 14),
    new MathProblem(18, 11, '-', 7)
  ];
  
  console.log(`Created ${problems.length} sample problems:`);
  problems.forEach((problem, index) => {
    console.log(`  ${index + 1}. ${problem.toString()}`);
  });
  console.log();
  
  // Create layout engine
  const layoutEngine = new LayoutEngine();
  
  // Test two-column layout
  console.log('--- Two-Column Layout ---');
  const twoColumnConfig = new WorksheetConfig({
    layout: 'two-column',
    difficulty: 'within20',
    operationType: 'mixed'
  });
  
  const twoColumnLayout = layoutEngine.calculateLayout(problems, twoColumnConfig);
  console.log(`Layout created with ${twoColumnLayout.problems.length} positioned problems`);
  console.log(`Page size: ${twoColumnLayout.pageSize.width} x ${twoColumnLayout.pageSize.height}`);
  console.log(`Columns: ${twoColumnLayout.layoutConfig.columns}`);
  console.log(`Rows: ${twoColumnLayout.metadata.rows}`);
  
  // Show first few problem positions
  console.log('\nFirst 4 problem positions:');
  twoColumnLayout.problems.slice(0, 4).forEach((problemPos, index) => {
    const pos = problemPos.position;
    const meta = problemPos.metadata;
    console.log(`  Problem ${index + 1}: Row ${meta.row}, Col ${meta.column} at (${Math.round(pos.x)}, ${Math.round(pos.y)}) size ${Math.round(pos.width)}x${Math.round(pos.height)}`);
  });
  
  // Test three-column layout
  console.log('\n--- Three-Column Layout ---');
  const threeColumnConfig = new WorksheetConfig({
    layout: 'three-column',
    difficulty: 'within20',
    operationType: 'mixed'
  });
  
  const threeColumnLayout = layoutEngine.calculateLayout(problems, threeColumnConfig);
  console.log(`Layout created with ${threeColumnLayout.problems.length} positioned problems`);
  console.log(`Columns: ${threeColumnLayout.layoutConfig.columns}`);
  console.log(`Rows: ${threeColumnLayout.metadata.rows}`);
  
  // Show layout statistics
  console.log('\n--- Layout Statistics ---');
  const stats = layoutEngine.getLayoutStatistics(threeColumnLayout);
  console.log(`Total problems: ${stats.totalProblems}`);
  console.log(`Grid: ${stats.columns} columns x ${stats.rows} rows`);
  console.log(`Average horizontal spacing: ${Math.round(stats.averageSpacing.horizontal)}px`);
  console.log(`Average vertical spacing: ${Math.round(stats.averageSpacing.vertical)}px`);
  console.log(`Horizontal utilization: ${Math.round(stats.utilization.horizontal * 100)}%`);
  console.log(`Vertical utilization: ${Math.round(stats.utilization.vertical * 100)}%`);
  
  // Test layout validation
  console.log('\n--- Layout Validation ---');
  const isValid = layoutEngine.validateLayout(threeColumnLayout);
  const hasOverlaps = layoutEngine.hasOverlaps(threeColumnLayout.problems);
  const fitsInBounds = layoutEngine.problemsFitInBounds(threeColumnLayout.problems, threeColumnLayout);
  
  console.log(`Layout is valid: ${isValid}`);
  console.log(`Has overlaps: ${hasOverlaps}`);
  console.log(`Fits in bounds: ${fitsInBounds}`);
  
  // Test with many problems
  console.log('\n--- Performance Test ---');
  const manyProblems = [];
  for (let i = 0; i < 50; i++) {
    const operand1 = Math.floor(Math.random() * 20) + 1;
    const operand2 = Math.floor(Math.random() * 20) + 1;
    const operator = '+';
    const result = operand1 + operand2;
    manyProblems.push(new MathProblem(operand1, operand2, operator, result));
  }
  
  const startTime = Date.now();
  const largeLayout = layoutEngine.calculateLayout(manyProblems, threeColumnConfig);
  const endTime = Date.now();
  
  console.log(`Calculated layout for ${manyProblems.length} problems in ${endTime - startTime}ms`);
  console.log(`Result: ${largeLayout.problems.length} positioned problems in ${largeLayout.metadata.rows} rows`);
  
  console.log('\n=== Demo Complete ===');
  
  return {
    twoColumnLayout,
    threeColumnLayout,
    largeLayout,
    stats
  };
}

// Export for browser use
if (typeof window !== 'undefined') {
  window.runLayoutDemo = runLayoutDemo;
}

// Export for Node.js use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runLayoutDemo };
}

// Auto-run if this file is executed directly in Node.js
if (typeof require !== 'undefined' && require.main === module) {
  // Load dependencies for Node.js
  const constants = require('../utils/constants');
  Object.assign(global, constants);
  
  const MathProblem = require('../models/MathProblem');
  const WorksheetConfig = require('../models/WorksheetConfig');
  const LayoutEngine = require('../core/LayoutEngine');
  
  // Make classes available globally
  global.MathProblem = MathProblem;
  global.WorksheetConfig = WorksheetConfig;
  global.LayoutEngine = LayoutEngine;
  
  runLayoutDemo();
}