/**
 * Unit tests for ConfigurationManager
 * Tests configuration creation, validation, and management functionality
 */

// Mock constants for testing
const mockConstants = {
  DIFFICULTY_LEVELS: {
    within10: { name: '10以内', maxNumber: 10, minNumber: 1 },
    within20: { name: '20以内', maxNumber: 20, minNumber: 1 }
  },
  OPERATION_TYPES: {
    addition: { name: '加法', symbol: '+' },
    subtraction: { name: '减法', symbol: '-' },
    mixed: { name: '加减混合', symbol: '±' }
  },
  LAYOUT_TYPES: {
    'two-column': { name: '两列', columns: 2, problemsPerPage: 20 },
    'three-column': { name: '三列', columns: 3, problemsPerPage: 30 }
  },
  BACKGROUND_STYLES: {
    blank: { name: '空白', type: 'solid' },
    lined: { name: '横线', type: 'lines' },
    custom: { name: '自定义', type: 'image' }
  },
  VALIDATION_RULES: {
    problemCount: { min: 1, max: 50 }
  }
};

// Set up global constants for testing
Object.assign(global, mockConstants);

// Import the classes to test
const WorksheetConfig = require('../models/WorksheetConfig');
const ConfigurationManager = require('../core/ConfigurationManager');

describe('ConfigurationManager', () => {
  let configManager;
  
  beforeEach(() => {
    configManager = new ConfigurationManager();
  });
  
  describe('Constructor', () => {
    test('should initialize with empty state', () => {
      expect(configManager.currentConfig).toBeNull();
      expect(configManager.configHistory).toEqual([]);
      expect(configManager.maxHistorySize).toBe(10);
    });
    
    test('should initialize validation rules', () => {
      expect(configManager.validationRules).toBeDefined();
      expect(configManager.validationRules.difficulty).toBeDefined();
      expect(configManager.validationRules.operationType).toBeDefined();
    });
  });
  
  describe('createConfig', () => {
    test('should create valid configuration with default options', () => {
      const config = configManager.createConfig();
      
      expect(config).toBeInstanceOf(WorksheetConfig);
      expect(config.difficulty).toBe('within20');
      expect(config.operationType).toBe('addition');
      expect(configManager.currentConfig).toBe(config);
    });
    
    test('should create configuration with custom options', () => {
      const options = {
        difficulty: 'within10',
        operationType: 'subtraction',
        layout: 'three-column',
        problemCount: 15
      };
      
      const config = configManager.createConfig(options);
      
      expect(config.difficulty).toBe('within10');
      expect(config.operationType).toBe('subtraction');
      expect(config.layout).toBe('three-column');
      expect(config.problemCount).toBe(15);
    });
    
    test('should throw error for invalid options', () => {
      const invalidOptions = {
        difficulty: 'invalid-difficulty',
        operationType: 'addition'
      };
      
      expect(() => {
        configManager.createConfig(invalidOptions);
      }).toThrow('Invalid configuration options');
    });
    
    test('should throw error for invalid problem count', () => {
      const invalidOptions = {
        difficulty: 'within10',
        problemCount: 100 // exceeds max
      };
      
      expect(() => {
        configManager.createConfig(invalidOptions);
      }).toThrow();
    });
  });
  
  describe('validateOptions', () => {
    test('should validate correct options', () => {
      const options = {
        difficulty: 'within10',
        operationType: 'addition',
        layout: 'two-column',
        backgroundStyle: 'blank',
        problemCount: 20
      };
      
      const result = configManager.validateOptions(options);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    test('should detect invalid difficulty', () => {
      const options = {
        difficulty: 'invalid-difficulty'
      };
      
      const result = configManager.validateOptions(options);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('difficulty must be one of: within10, within20');
    });
    
    test('should detect invalid problem count type', () => {
      const options = {
        problemCount: 'not-a-number'
      };
      
      const result = configManager.validateOptions(options);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('problemCount must be of type number, got string');
    });
    
    test('should detect problem count out of range', () => {
      const options = {
        problemCount: 0 // below minimum
      };
      
      const result = configManager.validateOptions(options);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('problemCount must be at least 1');
    });
    
    test('should detect missing custom background URL', () => {
      const options = {
        backgroundStyle: 'custom',
        customBackgroundUrl: null
      };
      
      const result = configManager.validateOptions(options);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('customBackgroundUrl'))).toBe(true);
    });
    
    test('should warn about unknown properties', () => {
      const options = {
        difficulty: 'within10',
        unknownProperty: 'value'
      };
      
      const result = configManager.validateOptions(options);
      
      expect(result.warnings).toContain('Unknown properties will be ignored: unknownProperty');
    });
  });
  
  describe('validateConfig', () => {
    test('should validate correct configuration', () => {
      const config = new WorksheetConfig({
        difficulty: 'within10',
        operationType: 'addition',
        layout: 'two-column',
        backgroundStyle: 'blank',
        problemCount: 15
      });
      
      const result = configManager.validateConfig(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    test('should reject non-WorksheetConfig objects', () => {
      const invalidConfig = { difficulty: 'within10' };
      
      const result = configManager.validateConfig(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Configuration must be an instance of WorksheetConfig');
    });
    
    test('should warn about high problem count', () => {
      const config = new WorksheetConfig({
        difficulty: 'within10',
        operationType: 'addition',
        layout: 'two-column',
        problemCount: 35 // significantly higher than recommended 20
      });
      
      const result = configManager.validateConfig(config);
      
      expect(result.warnings.some(warning => 
        warning.includes('significantly higher than recommended')
      )).toBe(true);
    });
  });
  
  describe('updateConfig', () => {
    test('should update configuration successfully', () => {
      const config = configManager.createConfig({
        difficulty: 'within10',
        operationType: 'addition'
      });
      
      const updates = {
        difficulty: 'within20',
        problemCount: 25
      };
      
      const updatedConfig = configManager.updateConfig(config, updates);
      
      expect(updatedConfig.difficulty).toBe('within20');
      expect(updatedConfig.problemCount).toBe(25);
      expect(configManager.currentConfig).toBe(updatedConfig);
    });
    
    test('should throw error for invalid updates', () => {
      const config = configManager.createConfig();
      const invalidUpdates = {
        difficulty: 'invalid-difficulty'
      };
      
      expect(() => {
        configManager.updateConfig(config, invalidUpdates);
      }).toThrow('Invalid updates');
    });
    
    test('should throw error for non-WorksheetConfig', () => {
      const invalidConfig = { difficulty: 'within10' };
      const updates = { problemCount: 15 };
      
      expect(() => {
        configManager.updateConfig(invalidConfig, updates);
      }).toThrow('Configuration must be an instance of WorksheetConfig');
    });
  });
  
  describe('History Management', () => {
    test('should save configuration to history', () => {
      const config = configManager.createConfig();
      
      configManager.saveToHistory(config);
      
      expect(configManager.configHistory).toHaveLength(1);
      expect(configManager.configHistory[0]).toEqual(config);
      expect(configManager.configHistory[0]).not.toBe(config); // should be a clone
    });
    
    test('should not save duplicate configurations', () => {
      const config = configManager.createConfig();
      
      configManager.saveToHistory(config);
      configManager.saveToHistory(config); // same config
      
      expect(configManager.configHistory).toHaveLength(1);
    });
    
    test('should maintain history size limit', () => {
      const baseConfig = configManager.createConfig();
      
      // Add more than maxHistorySize configurations
      for (let i = 0; i < 15; i++) {
        const config = baseConfig.clone();
        config.problemCount = i + 1; // make each config unique
        configManager.saveToHistory(config);
      }
      
      expect(configManager.configHistory).toHaveLength(configManager.maxHistorySize);
    });
    
    test('should clear history', () => {
      const config = configManager.createConfig();
      configManager.saveToHistory(config);
      
      configManager.clearHistory();
      
      expect(configManager.configHistory).toHaveLength(0);
    });
    
    test('should get history copy', () => {
      const config = configManager.createConfig();
      configManager.saveToHistory(config);
      
      const history = configManager.getHistory();
      history.push('modified'); // modify the returned array
      
      expect(configManager.configHistory).toHaveLength(1); // original should be unchanged
    });
  });
  
  describe('Current Configuration Management', () => {
    test('should get current configuration', () => {
      expect(configManager.getCurrentConfig()).toBeNull();
      
      const config = configManager.createConfig();
      expect(configManager.getCurrentConfig()).toBe(config);
    });
    
    test('should set current configuration', () => {
      const config = new WorksheetConfig({
        difficulty: 'within10',
        operationType: 'addition'
      });
      
      configManager.setCurrentConfig(config);
      
      expect(configManager.getCurrentConfig()).toBe(config);
    });
    
    test('should throw error when setting invalid configuration', () => {
      const invalidConfig = { difficulty: 'invalid' };
      
      expect(() => {
        configManager.setCurrentConfig(invalidConfig);
      }).toThrow('Invalid configuration');
    });
  });
  
  describe('Templates', () => {
    test('should create configuration from template', () => {
      const config = configManager.createFromTemplate('beginner-addition');
      
      expect(config.difficulty).toBe('within10');
      expect(config.operationType).toBe('addition');
      expect(config.title).toBe('10以内加法练习');
    });
    
    test('should throw error for unknown template', () => {
      expect(() => {
        configManager.createFromTemplate('unknown-template');
      }).toThrow("Template 'unknown-template' not found");
    });
    
    test('should get available templates', () => {
      const templates = configManager.getAvailableTemplates();
      
      expect(templates).toContain('beginner-addition');
      expect(templates).toContain('intermediate-mixed');
      expect(templates).toContain('advanced-subtraction');
    });
  });
  
  describe('Event Handling', () => {
    test('should add and notify event listeners', () => {
      const mockCallback = jest.fn();
      
      configManager.addEventListener('configCreated', mockCallback);
      const config = configManager.createConfig();
      
      expect(mockCallback).toHaveBeenCalledWith(config);
    });
    
    test('should remove event listeners', () => {
      const mockCallback = jest.fn();
      
      configManager.addEventListener('configCreated', mockCallback);
      configManager.removeEventListener('configCreated', mockCallback);
      
      configManager.createConfig();
      
      expect(mockCallback).not.toHaveBeenCalled();
    });
    
    test('should handle errors in event listeners gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      configManager.addEventListener('configCreated', errorCallback);
      configManager.createConfig();
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
  
  describe('Import/Export', () => {
    test('should export configuration as JSON', () => {
      const config = configManager.createConfig({
        difficulty: 'within10',
        operationType: 'addition',
        title: 'Test Worksheet'
      });
      
      const jsonString = configManager.exportConfig(config);
      const parsed = JSON.parse(jsonString);
      
      expect(parsed.difficulty).toBe('within10');
      expect(parsed.operationType).toBe('addition');
      expect(parsed.title).toBe('Test Worksheet');
    });
    
    test('should import configuration from JSON', () => {
      const configData = {
        difficulty: 'within20',
        operationType: 'subtraction',
        layout: 'three-column',
        backgroundStyle: 'lined',
        problemCount: 25,
        title: 'Imported Worksheet'
      };
      
      const jsonString = JSON.stringify(configData);
      const config = configManager.importConfig(jsonString);
      
      expect(config).toBeInstanceOf(WorksheetConfig);
      expect(config.difficulty).toBe('within20');
      expect(config.operationType).toBe('subtraction');
      expect(config.title).toBe('Imported Worksheet');
    });
    
    test('should throw error for invalid JSON', () => {
      const invalidJson = '{ invalid json }';
      
      expect(() => {
        configManager.importConfig(invalidJson);
      }).toThrow('Invalid JSON format');
    });
    
    test('should throw error for invalid configuration data', () => {
      const invalidConfigData = {
        difficulty: 'invalid-difficulty',
        operationType: 'addition'
      };
      
      const jsonString = JSON.stringify(invalidConfigData);
      
      expect(() => {
        configManager.importConfig(jsonString);
      }).toThrow('Imported configuration is invalid');
    });
  });
  
  describe('Statistics', () => {
    test('should get configuration statistics', () => {
      const config = configManager.createConfig();
      configManager.saveToHistory(config);
      
      const stats = configManager.getStatistics();
      
      expect(stats.historySize).toBe(1);
      expect(stats.maxHistorySize).toBe(10);
      expect(stats.hasCurrentConfig).toBe(true);
      expect(stats.currentConfig).toContain('20以内');
    });
    
    test('should handle empty state in statistics', () => {
      const stats = configManager.getStatistics();
      
      expect(stats.historySize).toBe(0);
      expect(stats.hasCurrentConfig).toBe(false);
      expect(stats.currentConfig).toBeNull();
    });
  });
  
  describe('Business Logic Validation', () => {
    test('should calculate maximum possible problems correctly', () => {
      // Test addition within 10: 10 * 10 = 100 combinations
      const additionConfig = new WorksheetConfig({
        difficulty: 'within10',
        operationType: 'addition',
        problemCount: 50
      });
      
      const result = configManager.validateConfig(additionConfig);
      expect(result.isValid).toBe(true); // 50 < 100, so valid
    });
    
    test('should detect impossible problem count for subtraction', () => {
      // For subtraction within 10, max combinations is much less than addition
      const subtractionConfig = new WorksheetConfig({
        difficulty: 'within10',
        operationType: 'subtraction',
        problemCount: 100 // likely too many
      });
      
      const result = configManager.validateConfig(subtractionConfig);
      expect(result.errors.some(error => 
        error.includes('exceeds maximum possible unique problems')
      )).toBe(true);
    });
  });
});