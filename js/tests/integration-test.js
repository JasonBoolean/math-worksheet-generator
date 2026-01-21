/**
 * Integration test for ConfigurationManager with WorksheetConfig
 */

// Set up constants in the global scope (simulating browser environment)
global.DIFFICULTY_LEVELS = {
  within10: { name: '10以内', maxNumber: 10, minNumber: 1 },
  within20: { name: '20以内', maxNumber: 20, minNumber: 1 },
  within100: { name: '100以内', maxNumber: 100, minNumber: 1 }
};

global.OPERATION_TYPES = {
  addition: { name: '加法', symbol: '+', operation: (a, b) => a + b },
  subtraction: { name: '减法', symbol: '-', operation: (a, b) => a - b },
  mixed: { name: '加减混合', symbol: '±', operation: null }
};

global.LAYOUT_TYPES = {
  'two-column': { name: '两列', columns: 2, problemsPerPage: 20, spacing: { horizontal: 50, vertical: 80 } },
  'three-column': { name: '三列', columns: 3, problemsPerPage: 30, spacing: { horizontal: 40, vertical: 70 } }
};

global.BACKGROUND_STYLES = {
  blank: { name: '空白', type: 'solid', color: '#ffffff' },
  lined: { name: '横线', type: 'lines', lineSpacing: 60, lineColor: '#e0e0e0', lineWidth: 1 },
  grid: { name: '方格', type: 'grid', gridSize: 40, lineColor: '#e0e0e0', lineWidth: 1 },
  custom: { name: '自定义', type: 'image', imageUrl: null }
};

global.VALIDATION_RULES = {
  problemCount: { min: 1, max: 50 }
};

console.log('Running integration test...\n');

try {
  // Load the classes
  const WorksheetConfig = require('../models/WorksheetConfig');
  const ConfigurationManager = require('../core/ConfigurationManager');
  
  console.log('✓ Classes loaded successfully');
  
  // Test 1: Create configuration manager
  const manager = new ConfigurationManager();
  console.log('✓ ConfigurationManager created');
  
  // Test 2: Create a configuration using the manager
  const config = manager.createConfig({
    difficulty: 'within20',
    operationType: 'addition',
    layout: 'two-column',
    backgroundStyle: 'blank',
    paperFormat: 'a4',
    problemCount: 20,
    title: 'Test Worksheet'
  });
  
  console.log('✓ Configuration created successfully');
  console.log('  - Type:', config.constructor.name);
  console.log('  - Difficulty:', config.difficulty);
  console.log('  - Operation:', config.operationType);
  console.log('  - Title:', config.title);
  
  // Test 3: Validate the configuration
  const validation = manager.validateConfig(config);
  console.log('✓ Configuration validation:', validation.isValid ? 'PASSED' : 'FAILED');
  if (!validation.isValid) {
    console.log('  Errors:', validation.errors);
  }
  
  // Test 4: Update configuration
  const updatedConfig = manager.updateConfig(config, {
    difficulty: 'within10',
    problemCount: 15
  });
  
  console.log('✓ Configuration updated successfully');
  console.log('  - New difficulty:', updatedConfig.difficulty);
  console.log('  - New problem count:', updatedConfig.problemCount);
  
  // Test 5: Save to history
  manager.saveToHistory(config);
  manager.saveToHistory(updatedConfig);
  
  const history = manager.getHistory();
  console.log('✓ History management works');
  console.log('  - History size:', history.length);
  
  // Test 6: Create from template
  const templateConfig = manager.createFromTemplate('beginner-addition');
  console.log('✓ Template creation works');
  console.log('  - Template difficulty:', templateConfig.difficulty);
  console.log('  - Template title:', templateConfig.title);
  
  // Test 7: Export/Import
  const exported = manager.exportConfig(templateConfig);
  const imported = manager.importConfig(exported);
  
  console.log('✓ Export/Import works');
  console.log('  - Exported length:', exported.length);
  console.log('  - Imported title:', imported.title);
  console.log('  - Configs equal:', templateConfig.equals(imported));
  
  console.log('\n🎉 All integration tests passed!');
  
} catch (error) {
  console.log('✗ Integration test failed:', error.message);
  console.log('Stack trace:', error.stack);
}