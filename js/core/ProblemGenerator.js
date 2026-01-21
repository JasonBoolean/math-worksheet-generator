/**
 * ProblemGenerator - Generates math problems based on configuration
 * Implements requirements 1.1, 6.1 for math problem generation
 */
class ProblemGenerator {
  constructor() {
    this.generatedProblems = new Set();
    this.maxRetries = 100; // Maximum attempts to generate unique problems
    this.numberUsageTracker = new Map(); // Track number usage for uniform distribution
    this.resetDistributionTracking();
  }
  
  /**
   * Reset distribution tracking for uniform number generation
   */
  resetDistributionTracking() {
    this.numberUsageTracker.clear();
  }
  
  /**
   * Get usage count for a number
   * @param {number} num - Number to check
   * @returns {number} Usage count
   */
  getNumberUsage(num) {
    return this.numberUsageTracker.get(num) || 0;
  }
  
  /**
   * Track number usage
   * @param {number} num - Number to track
   */
  trackNumberUsage(num) {
    const currentCount = this.getNumberUsage(num);
    this.numberUsageTracker.set(num, currentCount + 1);
  }
  
  /**
   * Generate math problems based on configuration
   * @param {WorksheetConfig} config - Worksheet configuration
   * @param {number} count - Number of problems to generate (optional, uses config.problemCount)
   * @returns {Array<MathProblem>} Array of generated problems
   */
  generateProblems(config, count = null) {
    if (!config) {
      throw new Error('Configuration is required');
    }
    
    const problemCount = count || config.problemCount || 20;
    const problems = [];
    const difficultyConfig = config.getDifficultyConfig();
    const operationConfig = config.getOperationConfig();
    
    // Clear previous generation tracking
    this.generatedProblems.clear();
    this.resetDistributionTracking();
    
    for (let i = 0; i < problemCount; i++) {
      let problem = null;
      let attempts = 0;
      
      // Try to generate a unique problem
      while (!problem && attempts < this.maxRetries) {
        const candidate = this.generateSingleProblem(difficultyConfig, operationConfig);
        
        if (this.validateProblem(candidate, config) && !this.isDuplicate(candidate)) {
          problem = candidate;
          this.generatedProblems.add(this.getProblemSignature(candidate));
          // Track number usage for distribution analysis
          this.trackNumberUsage(candidate.operand1);
          this.trackNumberUsage(candidate.operand2);
        }
        
        attempts++;
      }
      
      if (!problem) {
        // If we can't generate a unique problem, generate a valid one anyway
        problem = this.generateSingleProblem(difficultyConfig, operationConfig);
        console.warn(`Could not generate unique problem ${i + 1}, using duplicate`);
      }
      
      problems.push(problem);
    }
    
    return problems;
  }
  
  /**
   * Generate a single math problem
   * @param {Object} difficultyConfig - Difficulty configuration
   * @param {Object} operationConfig - Operation configuration
   * @returns {MathProblem} Generated problem
   */
  generateSingleProblem(difficultyConfig, operationConfig) {
    const { maxNumber, minNumber } = difficultyConfig;
    
    // Generate operands within the difficulty range
    let operand1 = this.randomInt(minNumber, maxNumber);
    let operand2 = this.randomInt(minNumber, maxNumber);
    
    // Determine operation type
    let operator;
    if (operationConfig.name === '加法') {
      operator = '+';
    } else if (operationConfig.name === '减法') {
      operator = '-';
      // For subtraction, ensure operand1 >= operand2 to avoid negative results
      if (operand1 < operand2) {
        [operand1, operand2] = [operand2, operand1];
      }
    } else if (operationConfig.name === '加减混合') {
      // Randomly choose between addition and subtraction
      operator = Math.random() < 0.5 ? '+' : '-';
      
      // For subtraction, ensure non-negative result
      if (operator === '-' && operand1 < operand2) {
        [operand1, operand2] = [operand2, operand1];
      }
    } else {
      throw new Error(`Unsupported operation type: ${operationConfig.name}`);
    }
    
    // Calculate result
    const result = operator === '+' ? operand1 + operand2 : operand1 - operand2;
    
    // Create and return the problem
    return new MathProblem(operand1, operand2, operator, result);
  }
  
  /**
   * Generate random integer between min and max (inclusive)
   * Uses improved distribution algorithm for better uniformity
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @param {boolean} useUniformDistribution - Whether to use uniform distribution tracking
   * @returns {number} Random integer
   */
  randomInt(min, max, useUniformDistribution = false) {
    if (useUniformDistribution) {
      return this.randomIntUniform(min, max);
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  /**
   * Generate random integer with uniform distribution tracking
   * Prefers less-used numbers to ensure better distribution
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random integer
   */
  randomIntUniform(min, max) {
    const range = max - min + 1;
    
    // For small ranges, use weighted selection based on usage
    if (range <= 20) {
      // Get usage counts for all numbers in range
      const numbers = [];
      for (let i = min; i <= max; i++) {
        numbers.push({ value: i, usage: this.getNumberUsage(i) });
      }
      
      // Find minimum usage count
      const minUsage = Math.min(...numbers.map(n => n.usage));
      
      // Filter to numbers with minimum or near-minimum usage
      const candidates = numbers.filter(n => n.usage <= minUsage + 1);
      
      // Randomly select from candidates
      const selected = candidates[Math.floor(Math.random() * candidates.length)];
      return selected.value;
    }
    
    // For larger ranges, use standard random with slight bias toward less-used numbers
    const candidate = Math.floor(Math.random() * range) + min;
    const usage = this.getNumberUsage(candidate);
    
    // 30% chance to try again if this number is heavily used
    if (usage > 2 && Math.random() < 0.3) {
      return Math.floor(Math.random() * range) + min;
    }
    
    return candidate;
  }
  
  /**
   * Generate diverse operands ensuring variety in number selection
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @param {number} count - Number of operands to generate
   * @returns {Array<number>} Array of diverse numbers
   */
  generateDiverseNumbers(min, max, count = 2) {
    const numbers = [];
    const range = max - min + 1;
    
    // If range is small, ensure we don't repeat too much
    if (range <= count) {
      // Generate all possible numbers and shuffle
      const allNumbers = [];
      for (let i = min; i <= max; i++) {
        allNumbers.push(i);
      }
      return this.shuffleArray(allNumbers).slice(0, count);
    }
    
    // For larger ranges, generate with diversity preference
    for (let i = 0; i < count; i++) {
      let num;
      let attempts = 0;
      
      do {
        num = this.randomIntUniform(min, max);
        attempts++;
      } while (numbers.includes(num) && attempts < 10);
      
      numbers.push(num);
    }
    
    return numbers;
  }
  
  /**
   * Validate a math problem against configuration
   * @param {MathProblem} problem - Problem to validate
   * @param {WorksheetConfig} config - Configuration to validate against
   * @returns {boolean} True if problem is valid
   */
  validateProblem(problem, config) {
    if (!(problem instanceof MathProblem)) {
      return false;
    }
    
    try {
      // Validate the problem itself (math correctness)
      problem.validate();
      
      // Check if problem fits the difficulty level
      if (!problem.fitsInDifficulty(config.difficulty)) {
        return false;
      }
      
      // Check if operation type matches configuration
      const operationConfig = config.getOperationConfig();
      if (operationConfig.name === '加法' && problem.operator !== '+') {
        return false;
      }
      if (operationConfig.name === '减法' && problem.operator !== '-') {
        return false;
      }
      // Mixed operations allow both + and -
      
      // Ensure result is non-negative
      if (problem.result < 0) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.warn('Problem validation failed:', error.message);
      return false;
    }
  }
  
  /**
   * Check if a problem is a duplicate
   * @param {MathProblem} problem - Problem to check
   * @returns {boolean} True if problem is duplicate
   */
  isDuplicate(problem) {
    const signature = this.getProblemSignature(problem);
    return this.generatedProblems.has(signature);
  }
  
  /**
   * Get a unique signature for a problem
   * @param {MathProblem} problem - Problem to get signature for
   * @returns {string} Problem signature
   */
  getProblemSignature(problem) {
    return `${problem.operand1}${problem.operator}${problem.operand2}`;
  }
  
  /**
   * Ensure problems are unique (remove duplicates)
   * @param {Array<MathProblem>} problems - Array of problems
   * @returns {Array<MathProblem>} Array of unique problems
   */
  ensureUniqueness(problems) {
    const seen = new Set();
    const uniqueProblems = [];
    
    for (const problem of problems) {
      const signature = this.getProblemSignature(problem);
      if (!seen.has(signature)) {
        seen.add(signature);
        uniqueProblems.push(problem);
      }
    }
    
    return uniqueProblems;
  }
  
  /**
   * Generate problems with balanced operation types for mixed mode
   * @param {WorksheetConfig} config - Worksheet configuration
   * @param {number} count - Number of problems to generate
   * @param {number} additionRatio - Ratio of addition problems (0-1), default 0.5
   * @returns {Array<MathProblem>} Array of balanced problems
   */
  generateBalancedProblems(config, count = null, additionRatio = 0.5) {
    const problemCount = count || config.problemCount || 20;
    
    if (config.operationType !== 'mixed') {
      return this.generateProblems(config, problemCount);
    }
    
    // Validate ratio
    if (additionRatio < 0 || additionRatio > 1) {
      throw new Error('Addition ratio must be between 0 and 1');
    }
    
    // Calculate counts based on ratio
    const additionCount = Math.round(problemCount * additionRatio);
    const subtractionCount = problemCount - additionCount;
    
    const problems = [];
    
    // Generate addition problems
    const additionConfig = config.clone();
    additionConfig.operationType = 'addition';
    const additionProblems = this.generateProblems(additionConfig, additionCount);
    problems.push(...additionProblems);
    
    // Generate subtraction problems
    const subtractionConfig = config.clone();
    subtractionConfig.operationType = 'subtraction';
    const subtractionProblems = this.generateProblems(subtractionConfig, subtractionCount);
    problems.push(...subtractionProblems);
    
    // Shuffle the problems to mix them
    return this.shuffleArray(problems);
  }
  
  /**
   * Generate problems with controlled operation type distribution
   * Ensures specified ratio of operation types in mixed mode
   * @param {WorksheetConfig} config - Worksheet configuration
   * @param {number} count - Number of problems to generate
   * @param {Object} ratioConfig - Ratio configuration {addition: 0.5, subtraction: 0.5}
   * @returns {Array<MathProblem>} Array of problems with controlled ratios
   */
  generateProblemsWithRatioControl(config, count = null, ratioConfig = null) {
    const problemCount = count || config.problemCount || 20;
    
    // Default ratio configuration
    const defaultRatio = { addition: 0.5, subtraction: 0.5 };
    const ratio = ratioConfig || defaultRatio;
    
    // Validate ratios
    const totalRatio = (ratio.addition || 0) + (ratio.subtraction || 0);
    if (Math.abs(totalRatio - 1.0) > 0.01) {
      throw new Error('Ratios must sum to 1.0');
    }
    
    if (config.operationType !== 'mixed') {
      // For non-mixed modes, use standard generation
      return this.generateProblems(config, problemCount);
    }
    
    // Calculate target counts for each operation type
    const additionTarget = Math.round(problemCount * ratio.addition);
    const subtractionTarget = problemCount - additionTarget;
    
    const problems = [];
    let additionCount = 0;
    let subtractionCount = 0;
    
    // Clear previous generation tracking
    this.generatedProblems.clear();
    this.resetDistributionTracking();
    
    const difficultyConfig = config.getDifficultyConfig();
    
    for (let i = 0; i < problemCount; i++) {
      let problem = null;
      let attempts = 0;
      
      // Determine which operation type to generate based on current counts
      let targetOperator;
      const additionNeeded = additionTarget - additionCount;
      const subtractionNeeded = subtractionTarget - subtractionCount;
      
      if (additionNeeded > 0 && subtractionNeeded > 0) {
        // Both needed, choose based on which is further from target
        const additionProgress = additionCount / additionTarget;
        const subtractionProgress = subtractionCount / subtractionTarget;
        targetOperator = additionProgress <= subtractionProgress ? '+' : '-';
      } else if (additionNeeded > 0) {
        targetOperator = '+';
      } else {
        targetOperator = '-';
      }
      
      // Generate problem with target operator
      while (!problem && attempts < this.maxRetries) {
        const operationConfig = { name: targetOperator === '+' ? '加法' : '减法' };
        const candidate = this.generateSingleProblem(difficultyConfig, operationConfig);
        
        if (this.validateProblem(candidate, config) && !this.isDuplicate(candidate)) {
          problem = candidate;
          this.generatedProblems.add(this.getProblemSignature(candidate));
          this.trackNumberUsage(candidate.operand1);
          this.trackNumberUsage(candidate.operand2);
          
          // Update counts
          if (problem.operator === '+') {
            additionCount++;
          } else {
            subtractionCount++;
          }
        }
        
        attempts++;
      }
      
      if (!problem) {
        // Fallback: generate any valid problem
        const operationConfig = { name: targetOperator === '+' ? '加法' : '减法' };
        problem = this.generateSingleProblem(difficultyConfig, operationConfig);
        if (problem.operator === '+') {
          additionCount++;
        } else {
          subtractionCount++;
        }
      }
      
      problems.push(problem);
    }
    
    // Shuffle to avoid predictable patterns
    return this.shuffleArray(problems);
  }
  
  /**
   * Analyze operation type distribution in a set of problems
   * @param {Array<MathProblem>} problems - Array of problems
   * @returns {Object} Distribution analysis
   */
  analyzeOperationDistribution(problems) {
    if (!problems || problems.length === 0) {
      return {
        total: 0,
        addition: 0,
        subtraction: 0,
        additionRatio: 0,
        subtractionRatio: 0,
        isBalanced: false
      };
    }
    
    const addition = problems.filter(p => p.operator === '+').length;
    const subtraction = problems.filter(p => p.operator === '-').length;
    const total = problems.length;
    
    const additionRatio = addition / total;
    const subtractionRatio = subtraction / total;
    
    // Consider balanced if ratios are within 10% of 50/50
    const isBalanced = Math.abs(additionRatio - 0.5) < 0.1;
    
    return {
      total,
      addition,
      subtraction,
      additionRatio: Math.round(additionRatio * 100) / 100,
      subtractionRatio: Math.round(subtractionRatio * 100) / 100,
      isBalanced,
      deviation: Math.abs(additionRatio - 0.5)
    };
  }
  
  /**
   * Shuffle an array using Fisher-Yates algorithm
   * @param {Array} array - Array to shuffle
   * @returns {Array} Shuffled array
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  /**
   * Generate problems with specific constraints
   * @param {Object} constraints - Additional constraints
   * @param {WorksheetConfig} config - Base configuration
   * @returns {Array<MathProblem>} Array of constrained problems
   */
  generateConstrainedProblems(constraints, config) {
    const problems = [];
    const { minResult, maxResult, allowZero, specificOperands } = constraints;
    
    for (let i = 0; i < (config.problemCount || 20); i++) {
      let problem = null;
      let attempts = 0;
      
      while (!problem && attempts < this.maxRetries) {
        const candidate = this.generateSingleProblem(
          config.getDifficultyConfig(),
          config.getOperationConfig()
        );
        
        // Check additional constraints
        let valid = this.validateProblem(candidate, config);
        
        if (valid && minResult !== undefined && candidate.result < minResult) {
          valid = false;
        }
        
        if (valid && maxResult !== undefined && candidate.result > maxResult) {
          valid = false;
        }
        
        if (valid && !allowZero && candidate.result === 0) {
          valid = false;
        }
        
        if (valid && specificOperands) {
          const hasSpecificOperand = specificOperands.includes(candidate.operand1) ||
                                   specificOperands.includes(candidate.operand2);
          if (!hasSpecificOperand) {
            valid = false;
          }
        }
        
        if (valid && !this.isDuplicate(candidate)) {
          problem = candidate;
          this.generatedProblems.add(this.getProblemSignature(candidate));
        }
        
        attempts++;
      }
      
      if (problem) {
        problems.push(problem);
      }
    }
    
    return problems;
  }
  
  /**
   * Get statistics about generated problems
   * @param {Array<MathProblem>} problems - Array of problems
   * @returns {Object} Statistics object
   */
  getStatistics(problems) {
    if (!problems || problems.length === 0) {
      return {
        total: 0,
        addition: 0,
        subtraction: 0,
        averageResult: 0,
        minResult: 0,
        maxResult: 0,
        uniqueCount: 0,
        numberDistribution: {},
        operationDistribution: {}
      };
    }
    
    const addition = problems.filter(p => p.operator === '+').length;
    const subtraction = problems.filter(p => p.operator === '-').length;
    const results = problems.map(p => p.result);
    const averageResult = results.reduce((sum, r) => sum + r, 0) / results.length;
    const minResult = Math.min(...results);
    const maxResult = Math.max(...results);
    const uniqueCount = this.ensureUniqueness(problems).length;
    
    // Calculate number distribution
    const numberDistribution = this.calculateNumberDistribution(problems);
    
    // Calculate operation distribution
    const operationDistribution = this.analyzeOperationDistribution(problems);
    
    return {
      total: problems.length,
      addition,
      subtraction,
      averageResult: Math.round(averageResult * 100) / 100,
      minResult,
      maxResult,
      uniqueCount,
      duplicateCount: problems.length - uniqueCount,
      numberDistribution,
      operationDistribution
    };
  }
  
  /**
   * Calculate distribution of numbers used in problems
   * @param {Array<MathProblem>} problems - Array of problems
   * @returns {Object} Distribution statistics
   */
  calculateNumberDistribution(problems) {
    const distribution = {};
    let totalNumbers = 0;
    
    for (const problem of problems) {
      distribution[problem.operand1] = (distribution[problem.operand1] || 0) + 1;
      distribution[problem.operand2] = (distribution[problem.operand2] || 0) + 1;
      totalNumbers += 2;
    }
    
    // Calculate statistics
    const counts = Object.values(distribution);
    const uniqueNumbers = Object.keys(distribution).length;
    const avgUsage = totalNumbers / uniqueNumbers;
    const maxUsage = Math.max(...counts);
    const minUsage = Math.min(...counts);
    
    // Calculate standard deviation for uniformity measure
    const variance = counts.reduce((sum, count) => {
      return sum + Math.pow(count - avgUsage, 2);
    }, 0) / counts.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      uniqueNumbers,
      totalNumbers,
      averageUsage: Math.round(avgUsage * 100) / 100,
      maxUsage,
      minUsage,
      standardDeviation: Math.round(stdDev * 100) / 100,
      distribution
    };
  }
  
  /**
   * Generate problems with optimized number distribution
   * Ensures more uniform distribution of numbers across problems
   * @param {WorksheetConfig} config - Worksheet configuration
   * @param {number} count - Number of problems to generate
   * @returns {Array<MathProblem>} Array of problems with optimized distribution
   */
  generateProblemsWithOptimizedDistribution(config, count = null) {
    if (!config) {
      throw new Error('Configuration is required');
    }
    
    const problemCount = count || config.problemCount || 20;
    const problems = [];
    const difficultyConfig = config.getDifficultyConfig();
    const operationConfig = config.getOperationConfig();
    
    // Clear previous generation tracking
    this.generatedProblems.clear();
    this.resetDistributionTracking();
    
    for (let i = 0; i < problemCount; i++) {
      let problem = null;
      let attempts = 0;
      
      // Try to generate a unique problem with good distribution
      while (!problem && attempts < this.maxRetries) {
        const candidate = this.generateSingleProblemOptimized(difficultyConfig, operationConfig);
        
        if (this.validateProblem(candidate, config) && !this.isDuplicate(candidate)) {
          problem = candidate;
          this.generatedProblems.add(this.getProblemSignature(candidate));
          // Track number usage for distribution
          this.trackNumberUsage(candidate.operand1);
          this.trackNumberUsage(candidate.operand2);
        }
        
        attempts++;
      }
      
      if (!problem) {
        // If we can't generate a unique problem, generate a valid one anyway
        problem = this.generateSingleProblemOptimized(difficultyConfig, operationConfig);
        console.warn(`Could not generate unique problem ${i + 1}, using duplicate`);
      }
      
      problems.push(problem);
    }
    
    return problems;
  }
  
  /**
   * Generate a single math problem with optimized number distribution
   * @param {Object} difficultyConfig - Difficulty configuration
   * @param {Object} operationConfig - Operation configuration
   * @returns {MathProblem} Generated problem
   */
  generateSingleProblemOptimized(difficultyConfig, operationConfig) {
    const { maxNumber, minNumber } = difficultyConfig;
    
    // Generate operands with uniform distribution
    let operand1 = this.randomIntUniform(minNumber, maxNumber);
    let operand2 = this.randomIntUniform(minNumber, maxNumber);
    
    // Determine operation type
    let operator;
    if (operationConfig.name === '加法') {
      operator = '+';
    } else if (operationConfig.name === '减法') {
      operator = '-';
      // For subtraction, ensure operand1 >= operand2 to avoid negative results
      if (operand1 < operand2) {
        [operand1, operand2] = [operand2, operand1];
      }
    } else if (operationConfig.name === '加减混合') {
      // Randomly choose between addition and subtraction
      operator = Math.random() < 0.5 ? '+' : '-';
      
      // For subtraction, ensure non-negative result
      if (operator === '-' && operand1 < operand2) {
        [operand1, operand2] = [operand2, operand1];
      }
    } else {
      throw new Error(`Unsupported operation type: ${operationConfig.name}`);
    }
    
    // Calculate result
    const result = operator === '+' ? operand1 + operand2 : operand1 - operand2;
    
    // Create and return the problem
    return new MathProblem(operand1, operand2, operator, result);
  }
  
  /**
   * Reset the generator state
   */
  reset() {
    this.generatedProblems.clear();
    this.resetDistributionTracking();
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProblemGenerator;
} else {
  window.ProblemGenerator = ProblemGenerator;
}