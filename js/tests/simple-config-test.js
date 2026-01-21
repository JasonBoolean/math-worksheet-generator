/**
 * Simple test for ConfigurationManager core functionality
 */

// Set up constants first
global.DIFFICULTY_LEVELS = {
  within10: { name: '10以内', maxNumber: 10, minNumber: 1 },
  within20: { name: '20以内', maxNumber: 20, minNumber: 1 },
  within100: { name: '100以内', maxNumber: 100, minNumber: 1 }
};

global.OPERATION_TYPES = {
  addition: { name: '加法', symbol: '+' },
  subtraction: { name: '减法', symbol: '-' },
  mixed: { name: '加减混合', symbol: '±' }
};

global.LAYOUT_TYPES = {
  'two-column': { name: '两列', columns: 2, problemsPerPage: 20 },
  'three-column': { name: '三列', columns: 3, problemsPerPage: 30 }
};

global.BACKGROUND_STYLES = {
  blank: { name: '空白', type: 'solid' },
  lined: { name: '横线', type: 'lines' },
  grid: { name: '方格', type: 'grid' },
  custom: { name: '自定义', type: 'image' }
};

global.VALIDATION_RULES = {
  problemCount: { min: 1, max: 50 }
};

// Load ConfigurationManager
const ConfigurationManager = require('../core/ConfigurationManager');

console.log('Testing ConfigurationManager core functionality...\n');

// Test 1: Constructor
console.log('Test 1: Constructor');
try {
  const manager = new ConfigurationManager();
  console.log('✓ ConfigurationManager created successfully');
  console.log('✓ Current config is null:', manager.currentConfig === null);
  console.log('✓ History is empty:', manager.configHistory.length === 0);
} catch (error) {
  console.log('✗ Constructor failed:', error.message);
}

// Test 2: Validation rules initialization
console.log('\nTest 2: Validation rules');
try {
  const manager = new ConfigurationManager();
  console.log('✓ Validation rules initialized:', typeof manager.validationRules === 'object');
  console.log('✓ Has difficulty validation:', manager.validationRules.difficulty !== undefined);
  console.log('✓ Has operation type validation:', manager.validationRules.operationType !== undefined);
} catch (error) {
  console.log('✗ Validation rules test failed:', error.message);
}

// Test 3: validateOptions method
console.log('\nTest 3: validateOptions method');
try {
  const manager = new ConfigurationManager();
  
  // Test valid options
  const validResult = manager.validateOptions({
    difficulty: 'within10',
    operationType: 'addition',
    layout: 'two-column',
    backgroundStyle: 'blank',
    paperFormat: 'a4',
    problemCount: 15
  });
  console.log('✓ Valid options pass validation:', validResult.isValid === true);
  
  // Test invalid options
  const invalidResult = manager.validateOptions({
    difficulty: 'invalid-difficulty'
  });
  console.log('✓ Invalid options fail validation:', invalidResult.isValid === false);
  console.log('✓ Error message provided:', invalidResult.errors.length > 0);
  
} catch (error) {
  console.log('✗ validateOptions test failed:', error.message);
}

// Test 4: Template functionality
console.log('\nTest 4: Template functionality');
try {
  const manager = new ConfigurationManager();
  const templates = manager.getAvailableTemplates();
  console.log('✓ Templates available:', templates.length > 0);
  console.log('✓ Templates include beginner-addition:', templates.includes('beginner-addition'));
} catch (error) {
  console.log('✗ Template test failed:', error.message);
}

// Test 5: Event system
console.log('\nTest 5: Event system');
try {
  const manager = new ConfigurationManager();
  let eventFired = false;
  
  manager.addEventListener('test-event', () => {
    eventFired = true;
  });
  
  manager._notifyListeners('test-event', {});
  console.log('✓ Event system works:', eventFired === true);
} catch (error) {
  console.log('✗ Event system test failed:', error.message);
}

// Test 6: Statistics
console.log('\nTest 6: Statistics');
try {
  const manager = new ConfigurationManager();
  const stats = manager.getStatistics();
  console.log('✓ Statistics available:', typeof stats === 'object');
  console.log('✓ Has history size:', typeof stats.historySize === 'number');
  console.log('✓ Has current config status:', typeof stats.hasCurrentConfig === 'boolean');
} catch (error) {
  console.log('✗ Statistics test failed:', error.message);
}

console.log('\nConfigurationManager core functionality tests completed!');