/**
 * Unit tests for LocalStorageManager
 * Tests user preferences, recent configs, and custom backgrounds storage
 */

// Mock localStorage for Node.js environment
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    data: {},
    getItem(key) {
      return this.data[key] || null;
    },
    setItem(key, value) {
      this.data[key] = value;
    },
    removeItem(key) {
      delete this.data[key];
    },
    clear() {
      this.data = {};
    }
  };
}

// Load dependencies
const LocalStorageManager = require('../services/LocalStorageManager.js');

// Mock STORAGE_KEYS if not available
if (typeof STORAGE_KEYS === 'undefined') {
  global.STORAGE_KEYS = {
    userPreferences: 'math-worksheet-preferences',
    recentConfigs: 'math-worksheet-recent-configs',
    customBackgrounds: 'math-worksheet-custom-backgrounds',
    appSettings: 'math-worksheet-app-settings'
  };
}

/**
 * Test suite for LocalStorageManager
 */
function runTests() {
  console.log('Running LocalStorageManager tests...\n');
  
  let passedTests = 0;
  let failedTests = 0;
  
  // Helper function to run a test
  function test(name, fn) {
    try {
      // Clear localStorage before each test
      localStorage.clear();
      
      fn();
      console.log(`✓ ${name}`);
      passedTests++;
    } catch (error) {
      console.error(`✗ ${name}`);
      console.error(`  Error: ${error.message}`);
      failedTests++;
    }
  }
  
  // Helper function for assertions
  function assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }
  
  function assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }
  
  function assertDeepEqual(actual, expected, message) {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
      throw new Error(message || `Expected ${expectedStr}, got ${actualStr}`);
    }
  }
  
  // Test 1: LocalStorageManager initialization
  test('should initialize with support check', () => {
    const manager = new LocalStorageManager();
    assert(manager.isSupported === true, 'localStorage should be supported');
    assert(manager.maxRecentConfigs === 10, 'maxRecentConfigs should be 10');
    assert(manager.maxCustomBackgrounds === 20, 'maxCustomBackgrounds should be 20');
  });
  
  // Test 2: Save and load preferences
  test('should save and load user preferences', () => {
    const manager = new LocalStorageManager();
    const preferences = {
      defaultConfig: { difficulty: 'within10', operationType: 'addition' },
      theme: 'dark',
      uiSettings: { showTips: true }
    };
    
    const saved = manager.savePreferences(preferences);
    assert(saved === true, 'savePreferences should return true');
    
    const loaded = manager.loadPreferences();
    assert(loaded !== null, 'loadPreferences should return data');
    assertEqual(loaded.theme, 'dark', 'theme should match');
    assert(loaded.defaultConfig !== null, 'defaultConfig should exist');
  });
  
  // Test 3: Save recent configuration
  test('should save recent configuration', () => {
    const manager = new LocalStorageManager();
    const config = {
      difficulty: 'within20',
      operationType: 'subtraction',
      layout: 'two-column'
    };
    
    const saved = manager.saveRecentConfig(config);
    assert(saved === true, 'saveRecentConfig should return true');
    
    const recentConfigs = manager.getRecentConfigs();
    assert(recentConfigs.length === 1, 'should have 1 recent config');
    assertDeepEqual(recentConfigs[0].config, config, 'config should match');
  });
  
  // Test 4: Recent configs limit
  test('should limit recent configs to maxRecentConfigs', () => {
    const manager = new LocalStorageManager();
    
    // Add more than maxRecentConfigs
    for (let i = 0; i < 15; i++) {
      manager.saveRecentConfig({ difficulty: `config-${i}` });
    }
    
    const recentConfigs = manager.getRecentConfigs();
    assert(recentConfigs.length === 10, 'should limit to 10 configs');
  });
  
  // Test 5: Remove duplicate configs
  test('should remove duplicate configs', () => {
    const manager = new LocalStorageManager();
    const config = { difficulty: 'within10', operationType: 'addition' };
    
    manager.saveRecentConfig(config);
    manager.saveRecentConfig(config);
    
    const recentConfigs = manager.getRecentConfigs();
    assert(recentConfigs.length === 1, 'should have only 1 config (no duplicates)');
  });
  
  // Test 6: Save custom background
  test('should save custom background', () => {
    const manager = new LocalStorageManager();
    const imageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const saved = manager.saveCustomBackground(imageData, 'Test Background');
    assert(saved === true, 'saveCustomBackground should return true');
    
    const backgrounds = manager.getCustomBackgrounds();
    assert(backgrounds.length === 1, 'should have 1 background');
    assertEqual(backgrounds[0].name, 'Test Background', 'name should match');
  });
  
  // Test 7: Delete custom background
  test('should delete custom background', () => {
    const manager = new LocalStorageManager();
    const imageData = 'data:image/png;base64,test';
    
    manager.saveCustomBackground(imageData, 'Test');
    const backgrounds = manager.getCustomBackgrounds();
    const backgroundId = backgrounds[0].id;
    
    const deleted = manager.deleteCustomBackground(backgroundId);
    assert(deleted === true, 'deleteCustomBackground should return true');
    
    const remainingBackgrounds = manager.getCustomBackgrounds();
    assert(remainingBackgrounds.length === 0, 'should have no backgrounds');
  });
  
  // Test 8: Clear all data
  test('should clear all data', () => {
    const manager = new LocalStorageManager();
    
    manager.savePreferences({ theme: 'dark' });
    manager.saveRecentConfig({ difficulty: 'within10' });
    manager.saveCustomBackground('data:image/png;base64,test', 'Test');
    
    const cleared = manager.clearData();
    assert(cleared === true, 'clearData should return true');
    
    const preferences = manager.loadPreferences();
    const recentConfigs = manager.getRecentConfigs();
    const backgrounds = manager.getCustomBackgrounds();
    
    assert(preferences === null, 'preferences should be null');
    assert(recentConfigs.length === 0, 'recentConfigs should be empty');
    assert(backgrounds.length === 0, 'backgrounds should be empty');
  });
  
  // Test 9: Clear recent configs only
  test('should clear recent configs only', () => {
    const manager = new LocalStorageManager();
    
    manager.savePreferences({ theme: 'dark' });
    manager.saveRecentConfig({ difficulty: 'within10' });
    
    const cleared = manager.clearRecentConfigs();
    assert(cleared === true, 'clearRecentConfigs should return true');
    
    const preferences = manager.loadPreferences();
    const recentConfigs = manager.getRecentConfigs();
    
    assert(preferences !== null, 'preferences should still exist');
    assert(recentConfigs.length === 0, 'recentConfigs should be empty');
  });
  
  // Test 10: Get storage info
  test('should get storage info', () => {
    const manager = new LocalStorageManager();
    
    manager.savePreferences({ theme: 'dark' });
    
    const info = manager.getStorageInfo();
    assert(info.supported === true, 'should be supported');
    assert(info.totalSize > 0, 'should have some data');
    assert(info.details !== undefined, 'should have details');
  });
  
  // Test 11: Export and import data
  test('should export and import data', () => {
    const manager = new LocalStorageManager();
    
    manager.savePreferences({ theme: 'dark' });
    manager.saveRecentConfig({ difficulty: 'within10' });
    
    const exported = manager.exportData();
    assert(exported !== null, 'exportData should return data');
    assert(exported.preferences !== null, 'should have preferences');
    assert(exported.recentConfigs.length > 0, 'should have recent configs');
    
    manager.clearData();
    
    const imported = manager.importData(exported);
    assert(imported === true, 'importData should return true');
    
    const preferences = manager.loadPreferences();
    assert(preferences !== null, 'preferences should be restored');
  });
  
  // Test 12: Handle null preferences
  test('should handle null preferences gracefully', () => {
    const manager = new LocalStorageManager();
    
    const loaded = manager.loadPreferences();
    assert(loaded === null, 'should return null when no preferences exist');
  });
  
  // Test 13: Generate unique IDs
  test('should generate unique IDs', () => {
    const manager = new LocalStorageManager();
    
    const id1 = manager.generateId();
    const id2 = manager.generateId();
    
    assert(id1 !== id2, 'IDs should be unique');
    assert(typeof id1 === 'string', 'ID should be a string');
  });
  
  // Test 14: Generate config IDs
  test('should generate consistent config IDs', () => {
    const manager = new LocalStorageManager();
    const config = { difficulty: 'within10', operationType: 'addition' };
    
    const id1 = manager.generateConfigId(config);
    const id2 = manager.generateConfigId(config);
    
    assertEqual(id1, id2, 'same config should generate same ID');
  });
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log(`Tests completed: ${passedTests + failedTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log('='.repeat(50));
  
  return failedTests === 0;
}

// Run tests if executed directly
if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runTests };
