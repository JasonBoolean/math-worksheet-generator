/**
 * WorksheetConfig - Configuration for generating math worksheets
 */
class WorksheetConfig {
  /**
   * Create a worksheet configuration
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    // Set default values
    this.difficulty = options.difficulty || 'within20';
    this.operationType = options.operationType || 'addition';
    this.layout = options.layout || 'two-column';
    this.backgroundStyle = options.backgroundStyle || 'blank';
    this.paperFormat = options.paperFormat || 'a4';
    this.customBackgroundUrl = options.customBackgroundUrl || null;
    this.problemCount = options.problemCount || this.getDefaultProblemCount();
    this.showAnswers = options.showAnswers || false;
    this.title = options.title || '';
    this.createdAt = new Date();
    
    // Validate configuration
    this.validate();
  }
  
  /**
   * Get default problem count based on layout
   * @returns {number} Default number of problems
   */
  getDefaultProblemCount() {
    const layoutConfig = LAYOUT_TYPES[this.layout];
    return layoutConfig ? layoutConfig.problemsPerPage : 20;
  }
  
  /**
   * Validate the configuration
   * @throws {Error} If configuration is invalid
   */
  validate() {
    // Validate difficulty level
    if (!DIFFICULTY_LEVELS[this.difficulty]) {
      throw new Error(`Invalid difficulty level: ${this.difficulty}`);
    }
    
    // Validate operation type
    if (!OPERATION_TYPES[this.operationType]) {
      throw new Error(`Invalid operation type: ${this.operationType}`);
    }
    
    // Validate layout
    if (!LAYOUT_TYPES[this.layout]) {
      throw new Error(`Invalid layout: ${this.layout}`);
    }
    
    // Validate background style
    if (!BACKGROUND_STYLES[this.backgroundStyle]) {
      throw new Error(`Invalid background style: ${this.backgroundStyle}`);
    }
    
    // Validate problem count
    if (!Number.isInteger(this.problemCount) || 
        this.problemCount < VALIDATION_RULES.problemCount.min || 
        this.problemCount > VALIDATION_RULES.problemCount.max) {
      throw new Error(`Problem count must be between ${VALIDATION_RULES.problemCount.min} and ${VALIDATION_RULES.problemCount.max}`);
    }
    
    // Validate custom background URL if provided
    if (this.backgroundStyle === 'custom' && !this.customBackgroundUrl) {
      throw new Error('Custom background URL is required when using custom background style');
    }
  }
  
  /**
   * Get difficulty configuration
   * @returns {Object} Difficulty configuration object
   */
  getDifficultyConfig() {
    return DIFFICULTY_LEVELS[this.difficulty];
  }
  
  /**
   * Get operation configuration
   * @returns {Object} Operation configuration object
   */
  getOperationConfig() {
    return OPERATION_TYPES[this.operationType];
  }
  
  /**
   * Get layout configuration
   * @returns {Object} Layout configuration object
   */
  getLayoutConfig() {
    return LAYOUT_TYPES[this.layout];
  }
  
  /**
   * Get background configuration
   * @returns {Object} Background configuration object
   */
  getBackgroundConfig() {
    const config = { ...BACKGROUND_STYLES[this.backgroundStyle] };
    if (this.backgroundStyle === 'custom' && this.customBackgroundUrl) {
      config.imageUrl = this.customBackgroundUrl;
    }
    return config;
  }
  
  /**
   * Create a copy of this configuration
   * @returns {WorksheetConfig} New configuration instance
   */
  clone() {
    return new WorksheetConfig({
      difficulty: this.difficulty,
      operationType: this.operationType,
      layout: this.layout,
      backgroundStyle: this.backgroundStyle,
      paperFormat: this.paperFormat,
      customBackgroundUrl: this.customBackgroundUrl,
      problemCount: this.problemCount,
      showAnswers: this.showAnswers,
      title: this.title
    });
  }
  
  /**
   * Check if this configuration equals another
   * @param {WorksheetConfig} other - Another configuration
   * @returns {boolean} True if configurations are equal
   */
  equals(other) {
    if (!(other instanceof WorksheetConfig)) {
      return false;
    }
    
    return this.difficulty === other.difficulty &&
           this.operationType === other.operationType &&
           this.layout === other.layout &&
           this.backgroundStyle === other.backgroundStyle &&
           this.paperFormat === other.paperFormat &&
           this.customBackgroundUrl === other.customBackgroundUrl &&
           this.problemCount === other.problemCount &&
           this.showAnswers === other.showAnswers &&
           this.title === other.title;
  }
  
  /**
   * Convert to plain object for serialization
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      difficulty: this.difficulty,
      operationType: this.operationType,
      layout: this.layout,
      backgroundStyle: this.backgroundStyle,
      paperFormat: this.paperFormat,
      customBackgroundUrl: this.customBackgroundUrl,
      problemCount: this.problemCount,
      showAnswers: this.showAnswers,
      title: this.title,
      createdAt: this.createdAt.toISOString()
    };
  }
  
  /**
   * Create WorksheetConfig from plain object
   * @param {Object} obj - Plain object with configuration data
   * @returns {WorksheetConfig} New configuration instance
   */
  static fromJSON(obj) {
    const config = new WorksheetConfig(obj);
    if (obj.createdAt) {
      config.createdAt = new Date(obj.createdAt);
    }
    return config;
  }
  
  /**
   * Get a human-readable description of this configuration
   * @returns {string} Configuration description
   */
  getDescription() {
    const difficulty = DIFFICULTY_LEVELS[this.difficulty].name;
    const operation = OPERATION_TYPES[this.operationType].name;
    const layout = LAYOUT_TYPES[this.layout].name;
    const background = BACKGROUND_STYLES[this.backgroundStyle].name;
    
    return `${difficulty} ${operation} (${layout}布局, ${background}背景)`;
  }
  
  /**
   * Get configuration hash for caching purposes
   * @returns {string} Configuration hash
   */
  getHash() {
    const str = JSON.stringify(this.toJSON());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
  
  /**
   * Update configuration with new values
   * @param {Object} updates - Object with properties to update
   * @returns {WorksheetConfig} This instance for chaining
   */
  update(updates) {
    Object.keys(updates).forEach(key => {
      if (this.hasOwnProperty(key)) {
        this[key] = updates[key];
      }
    });
    
    // Update problem count if layout changed
    if (updates.layout && !updates.problemCount) {
      this.problemCount = this.getDefaultProblemCount();
    }
    
    // Re-validate after updates
    this.validate();
    
    return this;
  }
  
  /**
   * Create a default configuration
   * @returns {WorksheetConfig} Default configuration instance
   */
  static createDefault() {
    return new WorksheetConfig({
      difficulty: 'within20',
      operationType: 'addition',
      layout: 'two-column',
      backgroundStyle: 'blank',
      paperFormat: 'a4',
      problemCount: 20,
      showAnswers: false,
      title: ''
    });
  }
  
  /**
   * Create configuration for quick generation
   * @param {string} difficulty - Difficulty level
   * @param {string} operationType - Operation type
   * @returns {WorksheetConfig} Quick configuration instance
   */
  static createQuick(difficulty = 'within20', operationType = 'addition') {
    return new WorksheetConfig({
      difficulty,
      operationType,
      layout: 'two-column',
      backgroundStyle: 'blank',
      paperFormat: 'a4',
      problemCount: LAYOUT_TYPES['two-column'].problemsPerPage,
      showAnswers: false,
      title: `${DIFFICULTY_LEVELS[difficulty].name}${OPERATION_TYPES[operationType].name}练习`
    });
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WorksheetConfig;
} else {
  window.WorksheetConfig = WorksheetConfig;
}