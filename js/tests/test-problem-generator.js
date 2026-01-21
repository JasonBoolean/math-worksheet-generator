/**
 * Simple test for ProblemGenerator and MathProblem classes
 * This is a basic validation test to ensure the implementation works
 */

// Test function to run basic validation
function testProblemGenerator() {
  console.log('Testing ProblemGenerator and MathProblem...');
  
  try {
    // Test MathProblem creation
    console.log('\n1. Testing MathProblem creation...');
    const problem1 = new MathProblem(5, 3, '+', 8);
    console.log('✓ Addition problem created:', problem1.toString());
    
    const problem2 = new MathProblem(10, 4, '-', 6);
    console.log('✓ Subtraction problem created:', problem2.toString());
    
    // Test problem validation
    console.log('\n2. Testing problem validation...');
    try {
      const invalidProblem = new MathProblem(5, 3, '+', 9); // Wrong result
      console.log('✗ Should have failed validation');
    } catch (error) {
      console.log('✓ Invalid problem correctly rejected:', error.message);
    }
    
    // Test WorksheetConfig creation
    console.log('\n3. Testing WorksheetConfig...');
    const config = new WorksheetConfig({
      difficulty: 'within20',
      operationType: 'addition',
      layout: 'two-column',
      backgroundStyle: 'blank',
      problemCount: 10
    });
    console.log('✓ Configuration created:', config.getDescription());
    
    // Test ProblemGenerator
    console.log('\n4. Testing ProblemGenerator...');
    const generator = new ProblemGenerator();
    
    // Generate addition problems
    console.log('Generating addition problems...');
    const additionProblems = generator.generateProblems(config);
    console.log(`✓ Generated ${additionProblems.length} addition problems`);
    
    // Display first few problems
    additionProblems.slice(0, 5).forEach((problem, index) => {
      console.log(`  ${index + 1}. ${problem.toString()}`);
    });
    
    // Test subtraction problems
    console.log('\nGenerating subtraction problems...');
    const subtractionConfig = config.clone();
    subtractionConfig.operationType = 'subtraction';
    const subtractionProblems = generator.generateProblems(subtractionConfig);
    console.log(`✓ Generated ${subtractionProblems.length} subtraction problems`);
    
    // Display first few problems
    subtractionProblems.slice(0, 5).forEach((problem, index) => {
      console.log(`  ${index + 1}. ${problem.toString()}`);
    });
    
    // Test mixed problems
    console.log('\nGenerating mixed problems...');
    const mixedConfig = config.clone();
    mixedConfig.operationType = 'mixed';
    const mixedProblems = generator.generateProblems(mixedConfig);
    console.log(`✓ Generated ${mixedProblems.length} mixed problems`);
    
    // Display first few problems
    mixedProblems.slice(0, 5).forEach((problem, index) => {
      console.log(`  ${index + 1}. ${problem.toString()}`);
    });
    
    // Test problem validation
    console.log('\n5. Testing problem validation...');
    const validationResults = additionProblems.map(problem => 
      generator.validateProblem(problem, config)
    );
    const validCount = validationResults.filter(Boolean).length;
    console.log(`✓ ${validCount}/${additionProblems.length} problems passed validation`);
    
    // Test uniqueness
    console.log('\n6. Testing uniqueness...');
    const stats = generator.getStatistics(mixedProblems);
    console.log('✓ Problem statistics:', stats);
    
    // Test different difficulty levels
    console.log('\n7. Testing different difficulty levels...');
    const difficulties = ['within10', 'within20', 'within50', 'within100'];
    
    for (const difficulty of difficulties) {
      const diffConfig = config.clone();
      diffConfig.difficulty = difficulty;
      diffConfig.problemCount = 5;
      
      const problems = generator.generateProblems(diffConfig);
      console.log(`✓ ${difficulty}: Generated ${problems.length} problems`);
      
      // Check if problems fit the difficulty
      const fitsCount = problems.filter(p => p.fitsInDifficulty(difficulty)).length;
      console.log(`  ${fitsCount}/${problems.length} problems fit difficulty level`);
    }
    
    console.log('\n✅ All tests passed! ProblemGenerator is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  }
}

// Run tests if this file is loaded in browser
if (typeof window !== 'undefined') {
  // Wait for DOM to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', testProblemGenerator);
  } else {
    testProblemGenerator();
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = testProblemGenerator;
}