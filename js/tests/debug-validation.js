/**
 * Debug validation logic
 */

// Set up constants
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

const ConfigurationManager = require('../core/ConfigurationManager');

console.log('Debugging validation logic...\n');

const manager = new ConfigurationManager();

const testOptions = {
  difficulty: 'within10',
  operationType: 'addition',
  layout: 'two-column',
  backgroundStyle: 'blank',
  problemCount: 15
};

console.log('Testing options:', JSON.stringify(testOptions, null, 2));

const result = manager.validateOptions(testOptions);

console.log('\nValidation result:');
console.log('- isValid:', result.isValid);
console.log('- errors:', result.errors);
console.log('- warnings:', result.warnings);

// Test individual validations
console.log('\nTesting individual validations:');
console.log('- difficulty valid:', DIFFICULTY_LEVELS.hasOwnProperty(testOptions.difficulty));
console.log('- operationType valid:', OPERATION_TYPES.hasOwnProperty(testOptions.operationType));
console.log('- layout valid:', LAYOUT_TYPES.hasOwnProperty(testOptions.layout));
console.log('- backgroundStyle valid:', BACKGROUND_STYLES.hasOwnProperty(testOptions.backgroundStyle));
console.log('- problemCount type:', typeof testOptions.problemCount);
console.log('- problemCount is integer:', Number.isInteger(testOptions.problemCount));
console.log('- problemCount in range:', testOptions.problemCount >= 1 && testOptions.problemCount <= 50);

// Check validation rules
console.log('\nValidation rules:');
console.log('- difficulty rule:', manager.validationRules.difficulty);
console.log('- operationType rule:', manager.validationRules.operationType);
console.log('- layout rule:', manager.validationRules.layout);
console.log('- backgroundStyle rule:', manager.validationRules.backgroundStyle);