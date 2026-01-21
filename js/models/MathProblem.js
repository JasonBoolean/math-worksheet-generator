/**
 * MathProblem - Represents a single math problem
 */
class MathProblem {
  /**
   * Create a math problem
   * @param {number} operand1 - First number
   * @param {number} operand2 - Second number
   * @param {string} operator - Operation symbol ('+' or '-')
   * @param {number} result - The answer
   * @param {string} id - Unique identifier
   */
  constructor(operand1, operand2, operator, result, id = null) {
    this.operand1 = operand1;
    this.operand2 = operand2;
    this.operator = operator;
    this.result = result;
    this.id = id || this.generateId();
    this.createdAt = new Date();
    
    // Validate the problem
    this.validate();
  }
  
  /**
   * Generate a unique ID for the problem
   * @returns {string} Unique identifier
   */
  generateId() {
    return `problem_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
  
  /**
   * Validate the math problem
   * @throws {Error} If the problem is invalid
   */
  validate() {
    // Check operands are positive integers
    if (!Number.isInteger(this.operand1) || this.operand1 < 0) {
      throw new Error('Operand1 must be a non-negative integer');
    }
    
    if (!Number.isInteger(this.operand2) || this.operand2 < 0) {
      throw new Error('Operand2 must be a non-negative integer');
    }
    
    // Check operator is valid
    if (this.operator !== '+' && this.operator !== '-') {
      throw new Error('Operator must be + or -');
    }
    
    // Check result is correct
    const expectedResult = this.operator === '+' 
      ? this.operand1 + this.operand2 
      : this.operand1 - this.operand2;
    
    if (this.result !== expectedResult) {
      throw new Error(`Result ${this.result} is incorrect. Expected ${expectedResult}`);
    }
    
    // For subtraction, ensure result is non-negative
    if (this.operator === '-' && this.result < 0) {
      throw new Error('Subtraction result cannot be negative');
    }
  }
  
  /**
   * Get the problem as a formatted string
   * @returns {string} Formatted problem string
   */
  toString() {
    return `${this.operand1} ${this.operator} ${this.operand2} = ____`;
  }
  
  /**
   * Get the problem with answer as a formatted string
   * @returns {string} Formatted problem with answer
   */
  toStringWithAnswer() {
    return `${this.operand1} ${this.operator} ${this.operand2} = ${this.result}`;
  }
  
  /**
   * Check if this problem is equal to another problem
   * @param {MathProblem} other - Another math problem
   * @returns {boolean} True if problems are identical
   */
  equals(other) {
    if (!(other instanceof MathProblem)) {
      return false;
    }
    
    return this.operand1 === other.operand1 &&
           this.operand2 === other.operand2 &&
           this.operator === other.operator;
  }
  
  /**
   * Create a copy of this problem
   * @returns {MathProblem} A new MathProblem instance
   */
  clone() {
    return new MathProblem(
      this.operand1,
      this.operand2,
      this.operator,
      this.result,
      this.id
    );
  }
  
  /**
   * Convert to plain object for serialization
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      operand1: this.operand1,
      operand2: this.operand2,
      operator: this.operator,
      result: this.result,
      createdAt: this.createdAt.toISOString()
    };
  }
  
  /**
   * Create MathProblem from plain object
   * @param {Object} obj - Plain object with problem data
   * @returns {MathProblem} New MathProblem instance
   */
  static fromJSON(obj) {
    const problem = new MathProblem(
      obj.operand1,
      obj.operand2,
      obj.operator,
      obj.result,
      obj.id
    );
    
    if (obj.createdAt) {
      problem.createdAt = new Date(obj.createdAt);
    }
    
    return problem;
  }
  
  /**
   * Get the difficulty level of this problem
   * @returns {string} Difficulty level identifier
   */
  getDifficultyLevel() {
    const maxOperand = Math.max(this.operand1, this.operand2);
    
    if (maxOperand <= 10) return 'within10';
    if (maxOperand <= 20) return 'within20';
    if (maxOperand <= 50) return 'within50';
    if (maxOperand <= 100) return 'within100';
    
    return 'custom';
  }
  
  /**
   * Check if this problem fits within a difficulty level
   * @param {string} difficultyLevel - Difficulty level to check
   * @returns {boolean} True if problem fits the difficulty
   */
  fitsInDifficulty(difficultyLevel) {
    // Import constants if available, otherwise use fallback
    const difficultyLevels = (typeof DIFFICULTY_LEVELS !== 'undefined') 
      ? DIFFICULTY_LEVELS 
      : {
          within10: { maxNumber: 10, minNumber: 1 },
          within20: { maxNumber: 20, minNumber: 1 },
          within50: { maxNumber: 50, minNumber: 1 },
          within100: { maxNumber: 100, minNumber: 1 }
        };
    
    if (!difficultyLevels[difficultyLevel]) {
      return false;
    }
    
    const { maxNumber, minNumber } = difficultyLevels[difficultyLevel];
    
    return this.operand1 >= minNumber && this.operand1 <= maxNumber &&
           this.operand2 >= minNumber && this.operand2 <= maxNumber &&
           this.result >= 0; // Ensure non-negative results
  }
  
  /**
   * Get display width estimate for layout purposes
   * @returns {number} Estimated display width in pixels
   */
  getDisplayWidth() {
    const text = this.toString();
    // Rough estimate: each character is about 30 pixels wide at default font size
    return text.length * 30;
  }
  
  /**
   * Get display height estimate for layout purposes
   * @returns {number} Estimated display height in pixels
   */
  getDisplayHeight() {
    // Standard height for a single line problem
    return 60;
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MathProblem;
} else {
  window.MathProblem = MathProblem;
}