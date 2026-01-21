/**
 * Demonstration of ConfigurationManager functionality
 * This file shows how to use the ConfigurationManager in a browser environment
 */

// This would normally be loaded via script tags in HTML
// For demo purposes, we'll assume all dependencies are loaded

function demonstrateConfigurationManager() {
  console.log('=== ConfigurationManager Demo ===\n');
  
  // Create a configuration manager
  const manager = new ConfigurationManager();
  
  // 1. Create a basic configuration
  console.log('1. Creating basic configuration...');
  const basicConfig = manager.createConfig({
    difficulty: 'within20',
    operationType: 'addition',
    layout: 'two-column',
    backgroundStyle: 'blank',
    paperFormat: 'a4',
    problemCount: 20,
    title: '基础加法练习'
  });
  
  console.log('   Created:', basicConfig.getDescription());
  console.log('   Problem count:', basicConfig.problemCount);
  console.log('   Background:', basicConfig.getBackgroundConfig().name);
  
  // 2. Create from template
  console.log('\n2. Creating from template...');
  const templateConfig = manager.createFromTemplate('intermediate-mixed');
  console.log('   Template config:', templateConfig.getDescription());
  console.log('   Title:', templateConfig.title);
  
  // 3. Update configuration
  console.log('\n3. Updating configuration...');
  const updatedConfig = manager.updateConfig(basicConfig, {
    difficulty: 'within10',
    backgroundStyle: 'lined',
    problemCount: 15
  });
  console.log('   Updated:', updatedConfig.getDescription());
  console.log('   New background:', updatedConfig.getBackgroundConfig().name);
  
  // 4. Validation examples
  console.log('\n4. Validation examples...');
  
  // Valid options
  const validResult = manager.validateOptions({
    difficulty: 'within20',
    operationType: 'subtraction',
    layout: 'three-column',
    backgroundStyle: 'grid',
    paperFormat: 'a4',
    problemCount: 25
  });
  console.log('   Valid options result:', validResult.isValid);
  
  // Invalid options
  const invalidResult = manager.validateOptions({
    difficulty: 'within200', // invalid
    operationType: 'multiplication', // invalid
    problemCount: 100 // too high
  });
  console.log('   Invalid options result:', invalidResult.isValid);
  console.log('   Errors:', invalidResult.errors.slice(0, 2)); // show first 2 errors
  
  // 5. History management
  console.log('\n5. History management...');
  manager.saveToHistory(basicConfig);
  manager.saveToHistory(templateConfig);
  manager.saveToHistory(updatedConfig);
  
  const history = manager.getHistory();
  console.log('   History size:', history.length);
  console.log('   Latest config:', history[history.length - 1].getDescription());
  
  // 6. Event handling
  console.log('\n6. Event handling...');
  let eventCount = 0;
  manager.addEventListener('configCreated', (config) => {
    eventCount++;
    console.log('   Event fired: New config created -', config.getDescription());
  });
  
  // This will trigger the event
  manager.createConfig({
    difficulty: 'within10',
    operationType: 'subtraction',
    layout: 'two-column',
    backgroundStyle: 'dotted',
    paperFormat: 'a4',
    problemCount: 12,
    title: '减法练习'
  });
  
  console.log('   Total events fired:', eventCount);
  
  // 7. Export/Import
  console.log('\n7. Export/Import...');
  const exported = manager.exportConfig(templateConfig);
  console.log('   Exported JSON length:', exported.length);
  
  const imported = manager.importConfig(exported);
  console.log('   Imported successfully:', imported instanceof WorksheetConfig);
  console.log('   Configs are equal:', templateConfig.equals(imported));
  
  // 8. Statistics
  console.log('\n8. Statistics...');
  const stats = manager.getStatistics();
  console.log('   Current config available:', stats.hasCurrentConfig);
  console.log('   History size:', stats.historySize);
  console.log('   Max history size:', stats.maxHistorySize);
  
  // 9. Available templates
  console.log('\n9. Available templates...');
  const templates = manager.getAvailableTemplates();
  console.log('   Available templates:', templates.join(', '));
  
  console.log('\n=== Demo Complete ===');
  
  return manager;
}

// Export for use in HTML
if (typeof window !== 'undefined') {
  window.demonstrateConfigurationManager = demonstrateConfigurationManager;
}

// For Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { demonstrateConfigurationManager };
}