/**
 * Tests for Algorithm Optimization (Task 11)
 * Tests number distribution uniformity and operation type ratio control
 */

// Test function for algorithm optimizations
function testAlgorithmOptimizations() {
  console.log('Testing Algorithm Optimizations...\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  try {
    // Test 1: Number Distribution Uniformity
    console.log('Test 1: Number Distribution Uniformity');
    totalTests++;
    
    const config = new WorksheetConfig({
      difficulty: 'within10',
      operationType: 'addition',
      layout: 'two-column',
      backgroundStyle: 'blank',
      problemCount: 50
    });
    
    const generator = new ProblemGenerator();
    const problems = generator.generateProblemsWithOptimizedDistribution(config);
    const stats = generator.getStatistics(problems);
    
    console.log(`  Generated ${problems.length} problems`);
    console.log(`  Unique numbers used: ${stats.numberDistribution.uniqueNumbers}`);
    console.log(`  Average usage per number: ${stats.numberDistribution.averageUsage}`);
    console.log(`  Standard deviation: ${stats.numberDistribution.standardDeviation}`);
    console.log(`  Max usage: ${stats.numberDistribution.maxUsage}`);
    console.log(`  Min usage: ${stats.numberDistribution.minUsage}`);
    
    // Check that distribution is reasonably uniform
    // For 50 problems (100 operands) with range 0-10 (11 numbers), expect ~9 uses per number
    // Standard deviation should be relatively low for good distribution
    if (stats.numberDistribution.standardDeviation < 5) {
      console.log('  ✓ Distribution is reasonably uniform');
      passedTests++;
    } else {
      console.log('  ✗ Distribution is not uniform enough');
    }
    
    // Test 2: Compare with standard generation
    console.log('\nTest 2: Compare Optimized vs Standard Distribution');
    totalTests++;
    
    const standardProblems = generator.generateProblems(config);
    const standardStats = generator.getStatistics(standardProblems);
    
    console.log(`  Standard generation:`);
    console.log(`    Unique numbers: ${standardStats.numberDistribution.uniqueNumbers}`);
    console.log(`    Std deviation: ${standardStats.numberDistribution.standardDeviation}`);
    console.log(`  Optimized generation:`);
    console.log(`    Unique numbers: ${stats.numberDistribution.uniqueNumbers}`);
    console.log(`    Std deviation: ${stats.numberDistribution.standardDeviation}`);
    
    // Optimized should have better (lower) standard deviation or more unique numbers
    if (stats.numberDistribution.standardDeviation <= standardStats.numberDistribution.standardDeviation ||
        stats.numberDistribution.uniqueNumbers >= standardStats.numberDistribution.uniqueNumbers) {
      console.log('  ✓ Optimized distribution is better or equal');
      passedTests++;
    } else {
      console.log('  ✗ Optimized distribution is not better');
    }
    
    // Test 3: Operation Type Ratio Control - Balanced (50/50)
    console.log('\nTest 3: Operation Type Ratio Control - Balanced');
    totalTests++;
    
    const mixedConfig = new WorksheetConfig({
      difficulty: 'within20',
      operationType: 'mixed',
      layout: 'two-column',
      backgroundStyle: 'blank',
      problemCount: 40
    });
    
    const balancedProblems = generator.generateProblemsWithRatioControl(mixedConfig, 40, {
      addition: 0.5,
      subtraction: 0.5
    });
    
    const balancedStats = generator.getStatistics(balancedProblems);
    console.log(`  Generated ${balancedProblems.length} problems`);
    console.log(`  Addition: ${balancedStats.addition} (${balancedStats.operationDistribution.additionRatio * 100}%)`);
    console.log(`  Subtraction: ${balancedStats.subtraction} (${balancedStats.operationDistribution.subtractionRatio * 100}%)`);
    console.log(`  Is balanced: ${balancedStats.operationDistribution.isBalanced}`);
    console.log(`  Deviation from 50/50: ${(balancedStats.operationDistribution.deviation * 100).toFixed(1)}%`);
    
    // Check that ratio is close to 50/50 (within 15% tolerance)
    if (balancedStats.operationDistribution.deviation < 0.15) {
      console.log('  ✓ Operation ratio is balanced');
      passedTests++;
    } else {
      console.log('  ✗ Operation ratio is not balanced');
    }
    
    // Test 4: Operation Type Ratio Control - Custom (70/30)
    console.log('\nTest 4: Operation Type Ratio Control - Custom 70/30');
    totalTests++;
    
    const customProblems = generator.generateProblemsWithRatioControl(mixedConfig, 40, {
      addition: 0.7,
      subtraction: 0.3
    });
    
    const customStats = generator.getStatistics(customProblems);
    console.log(`  Generated ${customProblems.length} problems`);
    console.log(`  Addition: ${customStats.addition} (${customStats.operationDistribution.additionRatio * 100}%)`);
    console.log(`  Subtraction: ${customStats.subtraction} (${customStats.operationDistribution.subtractionRatio * 100}%)`);
    
    // Check that ratio is close to 70/30 (within 15% tolerance)
    const targetAdditionRatio = 0.7;
    const actualDeviation = Math.abs(customStats.operationDistribution.additionRatio - targetAdditionRatio);
    console.log(`  Deviation from target 70%: ${(actualDeviation * 100).toFixed(1)}%`);
    
    if (actualDeviation < 0.15) {
      console.log('  ✓ Custom operation ratio is correct');
      passedTests++;
    } else {
      console.log('  ✗ Custom operation ratio is not correct');
    }
    
    // Test 5: Operation Type Ratio Control - Extreme (90/10)
    console.log('\nTest 5: Operation Type Ratio Control - Extreme 90/10');
    totalTests++;
    
    const extremeProblems = generator.generateProblemsWithRatioControl(mixedConfig, 40, {
      addition: 0.9,
      subtraction: 0.1
    });
    
    const extremeStats = generator.getStatistics(extremeProblems);
    console.log(`  Generated ${extremeProblems.length} problems`);
    console.log(`  Addition: ${extremeStats.addition} (${extremeStats.operationDistribution.additionRatio * 100}%)`);
    console.log(`  Subtraction: ${extremeStats.subtraction} (${extremeStats.operationDistribution.subtractionRatio * 100}%)`);
    
    // Check that ratio is close to 90/10 (within 15% tolerance)
    const extremeTargetRatio = 0.9;
    const extremeDeviation = Math.abs(extremeStats.operationDistribution.additionRatio - extremeTargetRatio);
    console.log(`  Deviation from target 90%: ${(extremeDeviation * 100).toFixed(1)}%`);
    
    if (extremeDeviation < 0.15) {
      console.log('  ✓ Extreme operation ratio is correct');
      passedTests++;
    } else {
      console.log('  ✗ Extreme operation ratio is not correct');
    }
    
    // Test 6: Verify generateBalancedProblems with custom ratio
    console.log('\nTest 6: generateBalancedProblems with custom ratio');
    totalTests++;
    
    const balancedWithRatio = generator.generateBalancedProblems(mixedConfig, 40, 0.6);
    const balancedRatioStats = generator.getStatistics(balancedWithRatio);
    
    console.log(`  Generated ${balancedWithRatio.length} problems`);
    console.log(`  Addition: ${balancedRatioStats.addition} (${balancedRatioStats.operationDistribution.additionRatio * 100}%)`);
    console.log(`  Subtraction: ${balancedRatioStats.subtraction} (${balancedRatioStats.operationDistribution.subtractionRatio * 100}%)`);
    
    const ratioDeviation = Math.abs(balancedRatioStats.operationDistribution.additionRatio - 0.6);
    console.log(`  Deviation from target 60%: ${(ratioDeviation * 100).toFixed(1)}%`);
    
    if (ratioDeviation < 0.15) {
      console.log('  ✓ Balanced problems with custom ratio works');
      passedTests++;
    } else {
      console.log('  ✗ Balanced problems with custom ratio failed');
    }
    
    // Test 7: Number diversity in small ranges
    console.log('\nTest 7: Number Diversity in Small Ranges');
    totalTests++;
    
    const smallRangeConfig = new WorksheetConfig({
      difficulty: 'within10',
      operationType: 'addition',
      layout: 'two-column',
      backgroundStyle: 'blank',
      problemCount: 30
    });
    
    const diverseProblems = generator.generateProblemsWithOptimizedDistribution(smallRangeConfig);
    const diverseStats = generator.getStatistics(diverseProblems);
    
    console.log(`  Generated ${diverseProblems.length} problems`);
    console.log(`  Unique numbers used: ${diverseStats.numberDistribution.uniqueNumbers}`);
    console.log(`  Total possible numbers: 11 (0-10)`);
    console.log(`  Coverage: ${(diverseStats.numberDistribution.uniqueNumbers / 11 * 100).toFixed(1)}%`);
    
    // Should use most of the available numbers
    if (diverseStats.numberDistribution.uniqueNumbers >= 8) {
      console.log('  ✓ Good number diversity');
      passedTests++;
    } else {
      console.log('  ✗ Poor number diversity');
    }
    
    // Test 8: Analyze operation distribution function
    console.log('\nTest 8: Analyze Operation Distribution Function');
    totalTests++;
    
    const testProblems = [
      new MathProblem(5, 3, '+', 8),
      new MathProblem(7, 2, '+', 9),
      new MathProblem(10, 4, '-', 6),
      new MathProblem(8, 3, '-', 5)
    ];
    
    const distribution = generator.analyzeOperationDistribution(testProblems);
    console.log(`  Total: ${distribution.total}`);
    console.log(`  Addition: ${distribution.addition} (${distribution.additionRatio * 100}%)`);
    console.log(`  Subtraction: ${distribution.subtraction} (${distribution.subtractionRatio * 100}%)`);
    console.log(`  Is balanced: ${distribution.isBalanced}`);
    
    if (distribution.addition === 2 && distribution.subtraction === 2 && distribution.isBalanced) {
      console.log('  ✓ Operation distribution analysis works correctly');
      passedTests++;
    } else {
      console.log('  ✗ Operation distribution analysis failed');
    }
    
    // Summary
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Test Summary: ${passedTests}/${totalTests} tests passed`);
    console.log(`${'='.repeat(50)}`);
    
    if (passedTests === totalTests) {
      console.log('✅ All algorithm optimization tests passed!');
      return true;
    } else {
      console.log(`⚠️  ${totalTests - passedTests} test(s) failed`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    console.error(error.stack);
    return false;
  }
}

// Run tests if this file is loaded in browser
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', testAlgorithmOptimizations);
  } else {
    testAlgorithmOptimizations();
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = testAlgorithmOptimizations;
}
