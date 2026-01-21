/**
 * ConfigurationManager - Manages worksheet configuration and validation
 * Handles creation, validation, and management of worksheet configurations
 * Implements requirements 4.1, 5.1, 6.1
 */

// Import WorksheetConfig if in Node.js environment
let WorksheetConfig;
if (typeof module !== 'undefined' && module.exports) {
  WorksheetConfig = require('../models/WorksheetConfig');
} else {
  WorksheetConfig = window.WorksheetConfig;
}

class ConfigurationManager {
  constructor() {
    this.currentConfig = null;
    this.configHistory = [];
    this.maxHistorySize = 10;
    this.validationRules = this._initializeValidationRules();
    this.eventListeners = new Map();
  }
  
  /**
   * Initialize validation rules
   * @private
   * @returns {Object} Validation rules object
   */
  _initializeValidationRules() {
    return {
      difficulty: {
        required: true,
        allowedValues: Object.keys(DIFFICULTY_LEVELS),
        validator: (value) => DIFFICULTY_LEVELS.hasOwnProperty(value)
      },
      operationType: {
        required: true,
        allowedValues: Object.keys(OPERATION_TYPES),
        validator: (value) => OPERATION_TYPES.hasOwnProperty(value)
      },
      layout: {
        required: true,
        allowedValues: Object.keys(LAYOUT_TYPES),
        validator: (value) => LAYOUT_TYPES.hasOwnProperty(value)
      },
      backgroundStyle: {
        required: true,
        allowedValues: Object.keys(BACKGROUND_STYLES),
        validator: (value) => BACKGROUND_STYLES.hasOwnProperty(value)
      },
      paperFormat: {
        required: true,
        allowedValues: ['a4'],
        validator: (value) => value === 'a4'
      },
      problemCount: {
        required: true,
        type: 'number',
        min: VALIDATION_RULES.problemCount.min,
        max: VALIDATION_RULES.problemCount.max,
        validator: (value) => Number.isInteger(value) && 
                             value >= VALIDATION_RULES.problemCount.min && 
                             value <= VALIDATION_RULES.problemCount.max
      },
      showAnswers: {
        required: false,
        type: 'boolean',
        validator: (value) => typeof value === 'boolean'
      },
      title: {
        required: false,
        type: 'string',
        maxLength: 100,
        validator: (value) => typeof value === 'string' && value.length <= 100
      },
      customBackgroundUrl: {
        required: false,
        type: 'string',
        validator: (value, config) => {
          if (config.backgroundStyle === 'custom') {
            return typeof value === 'string' && value.length > 0;
          }
          return true; // Not required for other background styles
        }
      }
    };
  }
  
  /**
   * Create a new configuration
   * @param {Object} options - Configuration options
   * @returns {WorksheetConfig} New configuration
   * @throws {Error} If configuration is invalid
   */
  createConfig(options = {}) {
    try {
      // Create config first with defaults, then validate
      const config = new WorksheetConfig(options);
      
      // Validate the created configuration
      const validation = this.validateConfig(config);
      if (!validation.isValid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
      }
      
      this.currentConfig = config;
      this._notifyListeners('configCreated', config);
      
      return config;
    } catch (error) {
      this._notifyListeners('configError', { error: error.message, options });
      throw error;
    }
  }
  
  /**
   * Validate configuration options before creating WorksheetConfig
   * @param {Object} options - Options to validate
   * @returns {Object} Validation result
   */
  validateOptions(options) {
    const errors = [];
    const warnings = [];
    
    // Check for unknown properties
    const knownProperties = Object.keys(this.validationRules);
    const unknownProps = Object.keys(options).filter(key => !knownProperties.includes(key));
    if (unknownProps.length > 0) {
      warnings.push(`Unknown properties will be ignored: ${unknownProps.join(', ')}`);
    }
    
    // Validate each property
    for (const [property, rule] of Object.entries(this.validationRules)) {
      const value = options[property];
      
      // Check required properties
      if (rule.required && (value === undefined || value === null)) {
        errors.push(`${property} is required`);
        continue;
      }
      
      // Skip validation if value is not provided and not required
      if (value === undefined || value === null) {
        continue;
      }
      
      // Type validation
      if (rule.type && typeof value !== rule.type) {
        errors.push(`${property} must be of type ${rule.type}, got ${typeof value}`);
        continue;
      }
      
      // Custom validator
      if (rule.validator && !rule.validator(value, options)) {
        if (rule.allowedValues) {
          errors.push(`${property} must be one of: ${rule.allowedValues.join(', ')}`);
        } else {
          errors.push(`${property} has invalid value: ${value}`);
        }
        continue;
      }
      
      // String length validation
      if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
        errors.push(`${property} must not exceed ${rule.maxLength} characters`);
      }
      
      // Number range validation
      if (rule.min !== undefined && value < rule.min) {
        errors.push(`${property} must be at least ${rule.min}`);
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push(`${property} must not exceed ${rule.max}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Validate configuration
   * @param {WorksheetConfig} config - Configuration to validate
   * @returns {Object} Validation result
   */
  validateConfig(config) {
    const errors = [];
    const warnings = [];
    
    if (!(config instanceof WorksheetConfig)) {
      return {
        isValid: false,
        errors: ['Configuration must be an instance of WorksheetConfig'],
        warnings: []
      };
    }
    
    try {
      // Use WorksheetConfig's built-in validation
      config.validate();
      
      // Additional business logic validation
      const businessValidation = this._validateBusinessRules(config);
      errors.push(...businessValidation.errors);
      warnings.push(...businessValidation.warnings);
      
      // Cross-field validation
      const crossFieldValidation = this._validateCrossFields(config);
      errors.push(...crossFieldValidation.errors);
      warnings.push(...crossFieldValidation.warnings);
      
    } catch (error) {
      errors.push(error.message);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Validate business rules
   * @private
   * @param {WorksheetConfig} config - Configuration to validate
   * @returns {Object} Validation result
   */
  _validateBusinessRules(config) {
    const errors = [];
    const warnings = [];
    
    // Validate problem count against layout
    const layoutConfig = config.getLayoutConfig();
    const recommendedCount = layoutConfig.problemsPerPage;
    
    if (config.problemCount > recommendedCount * 1.5) {
      warnings.push(`Problem count (${config.problemCount}) is significantly higher than recommended for ${layoutConfig.name} layout (${recommendedCount})`);
    }
    
    // Validate difficulty and operation type combination
    if (config.operationType === 'subtraction' && config.difficulty === 'within10') {
      // This is fine, but we might want to warn about limited variety
      if (config.problemCount > 15) {
        warnings.push('High problem count with within-10 subtraction may result in repeated problems');
      }
    }
    
    // Validate custom background requirements
    if (config.backgroundStyle === 'custom') {
      if (!config.customBackgroundUrl) {
        errors.push('Custom background URL is required when using custom background style');
      } else {
        // Basic URL validation
        try {
          new URL(config.customBackgroundUrl);
        } catch {
          errors.push('Custom background URL must be a valid URL');
        }
      }
    }
    
    return { errors, warnings };
  }
  
  /**
   * Validate cross-field dependencies
   * @private
   * @param {WorksheetConfig} config - Configuration to validate
   * @returns {Object} Validation result
   */
  _validateCrossFields(config) {
    const errors = [];
    const warnings = [];
    
    // Check if title is appropriate for configuration
    if (config.title && config.title.length > 0) {
      const difficultyName = DIFFICULTY_LEVELS[config.difficulty].name;
      const operationName = OPERATION_TYPES[config.operationType].name;
      
      if (!config.title.includes(difficultyName) && !config.title.includes(operationName)) {
        warnings.push('Title does not reflect the selected difficulty or operation type');
      }
    }
    
    // Validate problem count feasibility
    const difficultyConfig = config.getDifficultyConfig();
    const maxPossibleProblems = this._calculateMaxPossibleProblems(config);
    
    if (config.problemCount > maxPossibleProblems) {
      errors.push(`Requested problem count (${config.problemCount}) exceeds maximum possible unique problems (${maxPossibleProblems}) for this configuration`);
    }
    
    return { errors, warnings };
  }
  
  /**
   * Calculate maximum possible unique problems for a configuration
   * @private
   * @param {WorksheetConfig} config - Configuration
   * @returns {number} Maximum possible problems
   */
  _calculateMaxPossibleProblems(config) {
    const difficultyConfig = config.getDifficultyConfig();
    const { minNumber, maxNumber } = difficultyConfig;
    
    if (config.operationType === 'addition') {
      // For addition: all combinations of numbers in range
      const range = maxNumber - minNumber + 1;
      return range * range;
    } else if (config.operationType === 'subtraction') {
      // For subtraction: only valid combinations (no negative results)
      let count = 0;
      for (let a = minNumber; a <= maxNumber; a++) {
        for (let b = minNumber; b <= a; b++) {
          count++;
        }
      }
      return count;
    } else if (config.operationType === 'mixed') {
      // For mixed: combination of both
      const additionCount = (maxNumber - minNumber + 1) ** 2;
      let subtractionCount = 0;
      for (let a = minNumber; a <= maxNumber; a++) {
        for (let b = minNumber; b <= a; b++) {
          subtractionCount++;
        }
      }
      return additionCount + subtractionCount;
    }
    
    return 0;
  }
  
  /**
   * Update configuration
   * @param {WorksheetConfig} config - Configuration to update
   * @param {Object} updates - Updates to apply
   * @returns {WorksheetConfig} Updated configuration
   * @throws {Error} If update results in invalid configuration
   */
  updateConfig(config, updates) {
    if (!(config instanceof WorksheetConfig)) {
      throw new Error('Configuration must be an instance of WorksheetConfig');
    }
    
    try {
      const updatedConfig = config.update(updates);
      
      // Validate the updated configuration
      const validation = this.validateConfig(updatedConfig);
      if (!validation.isValid) {
        throw new Error(`Updated configuration is invalid: ${validation.errors.join(', ')}`);
      }
      
      this.currentConfig = updatedConfig;
      this._notifyListeners('configUpdated', { config: updatedConfig, updates });
      
      return updatedConfig;
    } catch (error) {
      this._notifyListeners('configError', { error: error.message, config, updates });
      throw error;
    }
  }
  
  /**
   * Save configuration to history
   * @param {WorksheetConfig} config - Configuration to save
   */
  saveToHistory(config) {
    if (!(config instanceof WorksheetConfig)) {
      throw new Error('Configuration must be an instance of WorksheetConfig');
    }
    
    // Don't save if it's the same as the last one
    if (this.configHistory.length > 0) {
      const lastConfig = this.configHistory[this.configHistory.length - 1];
      if (config.equals(lastConfig)) {
        return;
      }
    }
    
    this.configHistory.push(config.clone());
    
    // Maintain history size limit
    if (this.configHistory.length > this.maxHistorySize) {
      this.configHistory.shift();
    }
    
    this._notifyListeners('configSaved', config);
  }
  
  /**
   * Get configuration history
   * @returns {Array<WorksheetConfig>} Configuration history
   */
  getHistory() {
    return [...this.configHistory]; // Return a copy
  }
  
  /**
   * Clear configuration history
   */
  clearHistory() {
    this.configHistory = [];
    this._notifyListeners('historyCleared');
  }
  
  /**
   * Get current configuration
   * @returns {WorksheetConfig|null} Current configuration
   */
  getCurrentConfig() {
    return this.currentConfig;
  }
  
  /**
   * Set current configuration
   * @param {WorksheetConfig} config - Configuration to set as current
   * @throws {Error} If configuration is invalid
   */
  setCurrentConfig(config) {
    const validation = this.validateConfig(config);
    if (!validation.isValid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }
    
    this.currentConfig = config;
    this._notifyListeners('currentConfigChanged', config);
  }
  
  /**
   * Create a default configuration
   * @returns {WorksheetConfig} Default configuration
   */
  createDefaultConfig() {
    return this.createConfig({
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
   * Create configuration from template
   * @param {string} templateName - Template name
   * @returns {WorksheetConfig} Configuration from template
   * @throws {Error} If template is not found
   */
  createFromTemplate(templateName) {
    const templates = {
      'beginner-addition': {
        difficulty: 'within10',
        operationType: 'addition',
        layout: 'two-column',
        backgroundStyle: 'lined',
        paperFormat: 'a4',
        problemCount: 15,
        title: '10以内加法练习'
      },
      'intermediate-mixed': {
        difficulty: 'within20',
        operationType: 'mixed',
        layout: 'three-column',
        backgroundStyle: 'grid',
        paperFormat: 'a4',
        problemCount: 24,
        title: '20以内加减混合练习'
      },
      'advanced-subtraction': {
        difficulty: 'within100',
        operationType: 'subtraction',
        layout: 'two-column',
        backgroundStyle: 'blank',
        paperFormat: 'a4',
        problemCount: 20,
        title: '100以内减法练习'
      }
    };
    
    if (!templates[templateName]) {
      throw new Error(`Template '${templateName}' not found`);
    }
    
    return this.createConfig(templates[templateName]);
  }
  
  /**
   * Get available templates
   * @returns {Array<string>} Available template names
   */
  getAvailableTemplates() {
    return ['beginner-addition', 'intermediate-mixed', 'advanced-subtraction'];
  }
  
  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }
  
  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  removeEventListener(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  /**
   * Notify event listeners
   * @private
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  _notifyListeners(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }
  
  /**
   * Get configuration statistics
   * @returns {Object} Configuration statistics
   */
  getStatistics() {
    return {
      historySize: this.configHistory.length,
      maxHistorySize: this.maxHistorySize,
      currentConfig: this.currentConfig ? this.currentConfig.getDescription() : null,
      hasCurrentConfig: this.currentConfig !== null
    };
  }
  
  /**
   * Export configuration as JSON
   * @param {WorksheetConfig} config - Configuration to export
   * @returns {string} JSON string
   */
  exportConfig(config) {
    if (!(config instanceof WorksheetConfig)) {
      throw new Error('Configuration must be an instance of WorksheetConfig');
    }
    
    return JSON.stringify(config.toJSON(), null, 2);
  }
  
  /**
   * Import configuration from JSON
   * @param {string} jsonString - JSON string
   * @returns {WorksheetConfig} Imported configuration
   * @throws {Error} If JSON is invalid or configuration is invalid
   */
  importConfig(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      const config = WorksheetConfig.fromJSON(data);
      
      // Validate imported configuration
      const validation = this.validateConfig(config);
      if (!validation.isValid) {
        throw new Error(`Imported configuration is invalid: ${validation.errors.join(', ')}`);
      }
      
      return config;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format');
      }
      throw error;
    }
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConfigurationManager;
} else {
  window.ConfigurationManager = ConfigurationManager;
}